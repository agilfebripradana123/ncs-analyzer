<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\Assessment;

class ReportController extends Controller
{
    public function generate(Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        return response()->json([
            'success' => true,
            'message' => 'Report generation queued',
        ], 202);
    }

    public function show(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $report = $assessment->report;

        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Report not generated'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ReportResource($report),
        ]);
    }
}
