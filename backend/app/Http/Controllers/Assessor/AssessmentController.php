<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssessmentRequest;
use App\Http\Requests\UpdateAssessmentRequest;
use App\Http\Resources\AssessmentResource;
use App\Models\Assessment;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    public function index(Request $request)
    {
        $assessments = Assessment::where('assessor_id', $request->user()->id)
            ->with(['employee', 'consent', 'session'])
            ->paginate(20);

        return AssessmentResource::collection($assessments);
    }

    public function store(StoreAssessmentRequest $request)
    {
        $assessment = Assessment::create([
            ...$request->validated(),
            'assessor_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment created',
            'data' => new AssessmentResource($assessment),
        ], 201);
    }

    public function show(Request $request, Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        return response()->json([
            'success' => true,
            'data' => new AssessmentResource($assessment->load(['employee', 'consent', 'session', 'riskScore', 'report'])),
        ]);
    }

    public function update(UpdateAssessmentRequest $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $assessment->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Assessment updated',
            'data' => new AssessmentResource($assessment),
        ]);
    }

    public function start(Request $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $assessment->update(['status' => 'active', 'started_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment started',
            'data' => new AssessmentResource($assessment),
        ]);
    }

    public function complete(Request $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $assessment->update(['status' => 'completed', 'completed_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment completed',
            'data' => new AssessmentResource($assessment),
        ]);
    }

    public function destroy(Assessment $assessment)
    {
        $this->authorize('delete', $assessment);

        $assessment->update(['status' => 'cancelled']);

        return response()->json(['success' => true, 'message' => 'Assessment cancelled']);
    }
}
