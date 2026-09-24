<?php

namespace App\Jobs;

use App\Models\Assessment;
use App\Models\DetectionRule;
use App\Models\VisualFinding;
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
        $rules = DetectionRule::where('type', 'visual')->where('status', 'active')->get();

        foreach ($this->detections as $detection) {
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
                        ],
                        'severity' => $rule->severity,
                        'detected_at' => now(),
                    ]);
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
