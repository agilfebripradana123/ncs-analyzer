<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\DetectionRule;
use App\Models\LogFinding;
use App\Services\JudiSimilarityService;

class ActivityParserService
{
    public function parse(int $assessmentId, array $entries): int
    {
        $rules = DetectionRule::where('status', 'active')->get();
        $findingCount = 0;

        foreach ($entries as $entry) {
            $log = ActivityLog::create([
                'assessment_id' => $assessmentId,
                'activity_type' => $entry['type'] ?? 'unknown',
                'activity_data' => $entry,
                'occurred_at' => $entry['timestamp'] ?? now(),
            ]);

            $matched = false;
            foreach ($rules as $rule) {
                if ($this->matches($rule, $entry)) {
                    LogFinding::create([
                        'assessment_id' => $assessmentId,
                        'rule_id' => $rule->id,
                        'type' => $rule->name,
                        'description' => "Matched rule: {$rule->name}",
                        'evidence' => ['activity_log_id' => $log->id, 'data' => $entry, 'matcher' => 'keyword'],
                        'severity' => $rule->severity,
                        'detected_at' => now(),
                    ]);
                    $findingCount++;
                    $matched = true;
                }
            }

            // ponytail: similarity only on web/url entries. Upgrade to all entry types if needed.
            if (!$matched) {
                $text = $this->extractWebText($entry);
                if ($text !== null) {
                    $rule = DetectionRule::where('rule_config->matcher', 'similarity')
                        ->where('status', 'active')->first();
                    if (!$rule) {
                        $rule = DetectionRule::firstOrCreate(
                            ['name' => 'Judi Online (Similarity)'],
                            ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'similarity']]
                        );
                    }
                    $result = (new JudiSimilarityService((float) ($rule->rule_config['threshold'] ?? 0.35)))->match($text);
                    if ($result !== null) {
                        LogFinding::create([
                            'assessment_id' => $assessmentId,
                            'rule_id' => $rule->id,
                            'type' => 'Judi Online (Similarity)',
                            'description' => 'Detected: Judi Online (similarity: '.round($result['score'], 3).')',
                            'evidence' => [
                                'activity_log_id' => $log->id, 'data' => $entry,
                                'matcher' => 'similarity', 'confidence' => $result['score'],
                                'matched_corpus' => mb_substr($result['matched'], 0, 200),
                            ],
                            'severity' => $rule->severity,
                            'detected_at' => now(),
                        ]);
                        $findingCount++;
                    }
                }
            }
        }

        return $findingCount;
    }

    public function matches(DetectionRule $rule, array $entry): bool
    {
        $config = $rule->rule_config ?? [];
        $haystack = strtolower(json_encode($entry));

        if (!empty($config['keywords'])) {
            foreach ($config['keywords'] as $kw) {
                if (str_contains($haystack, strtolower($kw))) {
                    return true;
                }
            }
        }

        if (!empty($config['domains'])) {
            foreach ($config['domains'] as $domain) {
                if (str_contains($haystack, strtolower($domain))) {
                    return true;
                }
            }
        }

        return false;
    }

    /** Extract browsable text from log entry for similarity. null if nothing usable. */
    private function extractWebText(array $entry): ?string
    {
        $url = $entry['url'] ?? ($entry['activity_data']['url'] ?? null);
        $title = $entry['title'] ?? ($entry['activity_data']['title'] ?? null);
        $text = trim(($title ?? '').' '.($url ?? ''));
        return $text === '' ? null : $text;
    }
}
