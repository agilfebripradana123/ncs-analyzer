<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assessment;


class DashboardController extends Controller
{
    public function stats()
    {
        $assessmentsCount = Assessment::count();
        $activeCount = Assessment::where('status', 'active')->count();

        // Risk distribution (last 20 assessments with risk_score)
        $recentWithRisk = Assessment::with('riskScore')
            ->has('riskScore')
            ->latest()
            ->limit(20)
            ->get();

        $riskDistribution = [
            'low' => 0,
            'medium' => 0,
            'high' => 0,
            'critical' => 0,
        ];

        foreach ($recentWithRisk as $assessment) {
            $level = $assessment->riskScore?->level;
            if (isset($riskDistribution[$level])) {
                $riskDistribution[$level]++;
            }
        }

        // Recent assessments (latest 5 with employee_name + risk_score)
        $recentAssessments = Assessment::with('riskScore')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'assessment_code' => $a->assessment_code,
                    'employee' => $a->employee_name ? ['name' => $a->employee_name] : null,
                    'status' => $a->status,
                    'risk_score' => $a->riskScore ? ['score' => $a->riskScore->score] : null,
                    'created_at' => $a->created_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'counts' => [
                    'assessments' => $assessmentsCount,
                    'active' => $activeCount,
                ],
                'risk_distribution' => $riskDistribution,
                'recent_assessments' => $recentAssessments,
            ],
        ]);
    }
}