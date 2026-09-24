<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\DetectionRule;
use App\Models\LogFinding;

class ActivityParserService
{
    public function parse(int $assessmentId, array $entries): int
    {
        $rules = DetectionRule::where('type', 'log')->where('status', 'active')->get();
        $findingCount = 0;

        foreach ($entries as $entry) {
            $log = ActivityLog::create([
                'assessment_id' => $assessmentId,
                'activity_type' => $entry['type'] ?? 'unknown',
                'activity_data' => $entry,
                'occurred_at' => $entry['timestamp'] ?? now(),
            ]);

            foreach ($rules as $rule) {
                if ($this->matches($rule, $entry)) {
                    LogFinding::create([
                        'assessment_id' => $assessmentId,
                        'rule_id' => $rule->id,
                        'type' => $rule->name,
                        'description' => "Matched rule: {$rule->name}",
                        'evidence' => ['activity_log_id' => $log->id, 'data' => $entry],
                        'severity' => $rule->severity,
                        'detected_at' => now(),
                    ]);
                    $findingCount++;
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
}
