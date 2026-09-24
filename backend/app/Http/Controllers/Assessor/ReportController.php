<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\FindingResource;
use App\Http\Resources\ReportResource;
use App\Http\Resources\RiskScoreResource;
use App\Models\Assessment;
use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $userId = auth()->id();
        $search = $request->input('search');

        $query = Report::with(['assessment.employee'])
            ->whereNotNull('generated_at')
            ->whereHas('assessment', fn ($q) => $q->where('assessor_id', $userId));

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('summary', 'like', "%{$search}%")
                  ->orWhereHas('assessment', function ($a) use ($search) {
                      $a->where('assessment_code', 'like', "%{$search}%")
                        ->orWhereHas('employee', fn ($e) => $e->where('name', 'like', "%{$search}%"));
                  });
            });
        }

        $sortBy = $request->input('sort', 'generated_at');
        $sortOrder = $request->input('order', 'desc');
        $allowedSort = ['summary', 'total_findings', 'generated_at', 'created_at'];
        if (in_array($sortBy, $allowedSort)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->latest('generated_at');
        }

        return ReportResource::collection($query->paginate(20));
    }

    public function generate(Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $assessment->load(['riskScore', 'visualFindings.rule', 'logFindings.rule', 'employee']);

        $riskScore = $assessment->riskScore;
        $visual = $assessment->visualFindings;
        $log = $assessment->logFindings;

        $bySeverity = [];
        foreach ($visual->concat($log) as $f) {
            $sev = $f->severity ?? 'unknown';
            $bySeverity[$sev] = ($bySeverity[$sev] ?? 0) + 1;
        }

        $summary = [
            'risk_score' => $riskScore ? (float) $riskScore->score : 0,
            'risk_level' => $riskScore?->level ?? 'low',
            'visual_findings_count' => $visual->count(),
            'log_findings_count' => $log->count(),
            'by_severity' => $bySeverity,
        ];

        $report = Report::updateOrCreate(
            ['assessment_id' => $assessment->id],
            [
                'summary' => json_encode($summary),
                'total_findings' => $visual->count() + $log->count(),
                'generated_at' => now(),
            ]
        );

        $report->load('assessment.employee');

        return response()->json([
            'success' => true,
            'message' => 'Report generated',
            'data' => new ReportResource($report),
        ]);
    }

    public function show(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $report = $assessment->report;

        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Report not generated'], 404);
        }

        $assessment->load(['riskScore', 'visualFindings.rule', 'logFindings.rule', 'employee']);
        $report->load('assessment.employee');

        return response()->json([
            'success' => true,
            'data' => [
                'report' => new ReportResource($report),
                'risk_score' => $assessment->riskScore ? new RiskScoreResource($assessment->riskScore) : null,
                'visual_findings' => FindingResource::collection($assessment->visualFindings),
                'log_findings' => FindingResource::collection($assessment->logFindings),
            ],
        ]);
    }
}