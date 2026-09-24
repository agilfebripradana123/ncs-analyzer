<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\RiskScore;

class RiskScoreService
{
    private const WEIGHTS = [
        'low' => 1,
        'medium' => 3,
        'high' => 7,
        'critical' => 15,
    ];

    public function calculate(Assessment $assessment): RiskScore
    {
        $visualFindings = $assessment->visualFindings()->with('rule')->get();
        $logFindings = $assessment->logFindings()->with('rule')->get();

        $visualWeight = 0;
        $visualDetails = [];
        foreach ($visualFindings as $f) {
            $w = self::WEIGHTS[$f->severity] ?? 1;
            $visualWeight += $w;
            $visualDetails[] = ['rule' => $f->type, 'severity' => $f->severity, 'weight' => $w];
        }

        $logWeight = 0;
        $logDetails = [];
        foreach ($logFindings as $f) {
            $w = self::WEIGHTS[$f->severity] ?? 1;
            $logWeight += $w;
            $logDetails[] = ['rule' => $f->type, 'severity' => $f->severity, 'weight' => $w];
        }

        $total = $visualWeight + $logWeight;
        $level = $this->level($total);

        return RiskScore::updateOrCreate(
            ['assessment_id' => $assessment->id],
            [
                'score' => $total,
                'level' => $level,
                'calculation_data' => [
                    'visual_weight' => $visualWeight,
                    'log_weight' => $logWeight,
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
}
