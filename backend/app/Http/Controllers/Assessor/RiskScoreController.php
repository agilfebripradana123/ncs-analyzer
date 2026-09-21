<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\RiskScoreResource;
use App\Models\Assessment;

class RiskScoreController extends Controller
{
    public function show(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $riskScore = $assessment->riskScore;

        if (!$riskScore) {
            return response()->json(['success' => false, 'message' => 'Risk score not calculated'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new RiskScoreResource($riskScore),
        ]);
    }

    public function calculate(Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        return response()->json([
            'success' => true,
            'message' => 'Risk score calculation queued',
        ], 202);
    }
}
