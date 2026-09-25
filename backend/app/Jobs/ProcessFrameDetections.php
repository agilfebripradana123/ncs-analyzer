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
                    VisualFinding::create([
                        'assessment_id' => $this->assessment->id,
                        'rule_id' => $rule->id,
                        'type' => $rule->name,
                        'description' => "Detected: {$rule->name}",
                        'evidence' => [
                            'frame_evidence_id' => $this->frameEvidenceId,
                            'detection' => $detection,
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
                if ($text !== '') {
                    $result = $similarity->match($text);
                    $judiRule ??= DetectionRule::where('rule_config->matcher', 'similarity')
                        ->where('status', 'active')->first()
                        ?? DetectionRule::firstOrCreate(
                            ['name' => 'Judi Online (Similarity)'],
                            ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'similarity', 'threshold' => 0.35]]
                        );
                    if ($result !== null) {
                        VisualFinding::create([
                            'assessment_id' => $this->assessment->id,
                            'rule_id' => $judiRule->id,
                            'type' => 'Judi Online (Similarity)',
                            'description' => "Detected: Judi Online (similarity: " . round($result['score'], 3) . ")",
                            'evidence' => [
                                'frame_evidence_id' => $this->frameEvidenceId,
                                'detection' => $detection,
                                'matcher' => 'similarity',
                                'confidence' => $result['score'],
                                'matched_corpus' => mb_substr($result['matched'], 0, 200),
                            ],
                            'severity' => $judiRule->severity,
                            'detected_at' => now(),
                        ]);
                    }
                }
            }
        }
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
}
