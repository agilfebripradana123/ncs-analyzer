<?php

namespace App\Jobs;

use App\Models\Assessment;
use App\Models\DetectionRule;
use App\Models\VisualFinding;
use App\Services\JudiSimilarityService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessFrameDetections implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Assessment $assessment,
        public array $detections,
        public int $frameEvidenceId,
    ) {}

    public function handle(): void
    {
        $rules = DetectionRule::where('status', 'active')->get();
        $judiRule = null;
        $similarity = null;
        $best = null;

        $simRule = $rules->first(fn ($r) => ($r->rule_config['matcher'] ?? 'keyword') === 'similarity');
        if ($simRule !== null) {
            $similarity = new JudiSimilarityService((float) ($simRule->rule_config['threshold'] ?? 0.35));
        } else {
            $similarity = JudiSimilarityService::fromConfig();
        }

        foreach ($this->detections as $detection) {
            $matched = false;
            foreach ($rules as $rule) {
                if ($this->matches($rule, $detection)) {
                    $text = trim(mb_strtolower($detection['text'] ?? $detection['label'] ?? ''));
                    // temporal dedup: same rule + same analyzed text within 60s
                    if ($this->recentFinding($rule->id, $text)) {
                        $matched = true;
                        continue;
                    }
                    VisualFinding::create([
                        'assessment_id' => $this->assessment->id,
                        'rule_id' => $rule->id,
                        'type' => $rule->name,
                        'description' => "Detected: {$rule->name}",
                        'evidence' => [
                            'frame_evidence_id' => $this->frameEvidenceId,
                            'detection' => $detection,
                            'analyzed_text' => $detection['text'] ?? $detection['label'] ?? '',
                            'matcher' => 'keyword',
                        ],
                        'severity' => $rule->severity,
                        'detected_at' => now(),
                    ]);
                    $matched = true;
                }
            }

            if (!$matched && $similarity !== null) {
                $text = $detection['text'] ?? $detection['label'] ?? '';
                if ($text !== '' && $text !== null) {
                    $result = $similarity->match($text);
                    // ponytail: dedup per frame, keep best score only. Upgrade to
                    // temporal window (e.g. skip same matched_corpus within 60s) later.
                    if ($result !== null && ($best === null || $result['score'] > $best['score'])) {
                        $best = [
                            'score' => $result['score'],
                            'matched' => $result['matched'],
                            'text' => $text,
                        ];
                    }
                }
            }
        }

        if ($best === null) {
            return;
        }

        $judiRule ??= DetectionRule::where('rule_config->matcher', 'similarity')
            ->where('status', 'active')->first()
            ?? DetectionRule::firstOrCreate(
                ['name' => 'Judi Online (Similarity)'],
                ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'similarity', 'threshold' => 0.35]]
            );

        $matchedCorpus = mb_substr($best['matched'], 0, 200);

        // temporal dedup: skip same corpus match within 60s
        if ($this->recentCorpusFinding($judiRule->id, $matchedCorpus)) {
            return;
        }

        VisualFinding::create([
            'assessment_id' => $this->assessment->id,
            'rule_id' => $judiRule->id,
            'type' => 'Judi Online (Similarity)',
            'description' => "Detected: Judi Online (similarity: " . round($best['score'], 3) . ")",
            'evidence' => [
                'frame_evidence_id' => $this->frameEvidenceId,
                'analyzed_text' => $best['text'],
                'matcher' => 'similarity',
                'confidence' => $best['score'],
                'matched_corpus' => $matchedCorpus,
            ],
            'severity' => $judiRule->severity,
            'detected_at' => now(),
        ]);
    }

    private function matches(DetectionRule $rule, array $detection): bool
    {
        $config = $rule->rule_config ?? [];
        $label = strtolower($detection['label'] ?? '');
        $type = strtolower($detection['type'] ?? '');
        $text = strtolower($detection['text'] ?? '');
        $json = strtolower(json_encode($detection));

        if (!empty($config['keywords'])) {
            foreach ($config['keywords'] as $kw) {
                $lk = strtolower($kw);
                if (str_contains($label, $lk) || str_contains($type, $lk) || str_contains($text, $lk) || str_contains($json, $lk)) {
                    return true;
                }
            }
        }

        return false;
    }

    /** Skip if same rule + normalized analyzed_text already exists for this assessment within 60s. */
    private function recentFinding(int $ruleId, string $analyzedText): bool
    {
        return VisualFinding::where('assessment_id', $this->assessment->id)
            ->where('rule_id', $ruleId)
            ->where('detected_at', '>=', now()->subSeconds(60))
            ->get()
            ->contains(fn ($f) => mb_strtolower(trim($f->evidence['analyzed_text'] ?? '')) === $analyzedText);
    }

    /** Skip if same matched_corpus already exists for this assessment within 60s. */
    private function recentCorpusFinding(int $ruleId, string $matchedCorpus): bool
    {
        return VisualFinding::where('assessment_id', $this->assessment->id)
            ->where('rule_id', $ruleId)
            ->where('detected_at', '>=', now()->subSeconds(60))
            ->get()
            ->contains(fn ($f) => ($f->evidence['matched_corpus'] ?? null) === $matchedCorpus);
    }
}