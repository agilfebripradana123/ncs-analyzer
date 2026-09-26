<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\LogFinding;
use App\Models\RiskScore;
use App\Models\VisualFinding;

class RiskScoreService
{
    private const WEIGHTS = [
        'low' => 1,
        'medium' => 3,
        'high' => 7,
        'critical' => 15,
    ];

    /** Skor per layer maksimal 100; total maksimal 100 agar konsisten dgn UI /100. */
    private const MAX_SCORE = 100;

    public function calculate(Assessment $assessment): RiskScore
    {
        $visualFindings = $assessment->visualFindings()->with('rule')->get();
        $logFindings = $assessment->logFindings()->with('rule')->get();

        $visualWeight = 0;
        $visualDetails = [];
        foreach ($visualFindings as $f) {
            $w = $this->findingWeight($f);
            $visualWeight += $w;
            $visualDetails[] = ['rule' => $f->type, 'severity' => $f->severity, 'weight' => $w];
        }

        $logWeight = 0;
        $logDetails = [];
        foreach ($logFindings as $f) {
            $w = $this->findingWeight($f);
            $logWeight += $w;
            $logDetails[] = ['rule' => $f->type, 'severity' => $f->severity, 'weight' => $w];
        }

        $visual = min($visualWeight, self::MAX_SCORE);
        $log = min($logWeight, self::MAX_SCORE);
        $total = min($visual + $log, self::MAX_SCORE);
        $level = $this->level($total);

        return RiskScore::updateOrCreate(
            ['assessment_id' => $assessment->id],
            [
                'score' => $total,
                'level' => $level,
                'calculation_data' => [
                    'visual_weight' => $visual,
                    'log_weight' => $log,
                    'visual_details' => $visualDetails,
                    'log_details' => $logDetails,
                ],
                'calculated_at' => now(),
            ]
        );
    }

    public function level(int|float $score): string
    {
        return match (true) {
            $score >= 30 => 'critical',
            $score >= 15 => 'high',
            $score >= 5 => 'medium',
            default => 'low',
        };
    }

    /** Similarity finding minimal severity high (bobot 7). Tidak ada pengurangan. */
    private function findingWeight(VisualFinding|LogFinding $f): float
    {
        $w = self::WEIGHTS[$f->severity] ?? 1;
        if (($f->evidence['matcher'] ?? 'keyword') === 'similarity') {
            // ponytail: similarity minimal high=7. Upgrade to confidence-scaled
            // (weight * score) when corpus calibrated.
            $w = max($w, self::WEIGHTS['high']);
        }
        return $w;
    }
}
