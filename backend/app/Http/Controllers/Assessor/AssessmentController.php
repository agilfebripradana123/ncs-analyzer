<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssessmentRequest;
use App\Http\Requests\UpdateAssessmentRequest;
use App\Http\Resources\AssessmentResource;
use App\Models\Assessment;
use App\Services\RiskScoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AssessmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Assessment::where('assessor_id', $request->user()->id)
            ->with(['employee', 'consent', 'session', 'riskScore', 'assessor'])
            ->withCount(['visualFindings', 'logFindings']);

        $sortBy = $request->input('sort', 'created_at');
        $sortOrder = $request->input('order', 'desc');
        $allowedSort = ['id', 'title', 'status', 'assessor_id', 'employee_id', 'created_at'];
        if (in_array($sortBy, $allowedSort)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        return AssessmentResource::collection($query->paginate(20));
    }

    public function store(StoreAssessmentRequest $request)
    {
        $assessment = Assessment::create([
            'employee_id' => $request->validated('employee_id'),
            'assessor_id' => $request->user()->id,
            'status' => 'pending_consent',
        ]);

        $session = $assessment->session()->create([
            'session_token' => Str::random(64),
            'consent_token' => 'NCS-' . strtoupper(Str::random(6)),
            'status' => 'pending',
            'started_at' => now(),
            'expires_at' => now()->addMinutes(30),
        ]);

        $assessment->load('employee');

        return response()->json([
            'message' => 'Penilaian berhasil dibuat',
            'data' => [
                'id' => $assessment->id,
                'assessment_code' => $assessment->assessment_code,
                'employee' => $assessment->employee->name,
                'status' => $assessment->status,
                'session_code' => $session->consent_token,
                'consent_url' => url('/consent/' . $session->consent_token),
            ],
        ], 201);
    }

    public function show(Request $request, Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        return response()->json([
            'success' => true,
            'data' => new AssessmentResource($assessment->load(['employee', 'consent', 'session', 'riskScore', 'report', 'assessor'])),
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
        
        if ($session = $assessment->session) {
            $session->update(['status' => 'active']);
        }

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

        app(RiskScoreService::class)->calculate($assessment);

        return response()->json([
            'success' => true,
            'message' => 'Assessment completed',
            'data' => new AssessmentResource($assessment->load('riskScore')),
        ]);
    }

    public function destroy(Assessment $assessment)
    {
        $this->authorize('delete', $assessment);

        $assessment->update(['status' => 'cancelled']);

        return response()->json(['success' => true, 'message' => 'Assessment cancelled']);
    }
}
