<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionResource;
use App\Models\Assessment;
use App\Models\AssessmentSession;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    public function index()
    {
        $query = AssessmentSession::with(['assessment']);

        if ($search = request('search')) {
            $query->whereHas('assessment', function ($q) use ($search) {
                $q->where('employee_name', 'like', "%{$search}%")
                  ->orWhere('employee_department', 'like', "%{$search}%");
            });
        }

        $sortBy = request('sort', 'created_at');
        $sortOrder = request('order', 'desc');
        $allowedSort = ['session_token', 'status', 'started_at', 'expires_at', 'created_at'];
        if (in_array($sortBy, $allowedSort)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->latest();
        }

        return SessionResource::collection($query->paginate(20));
    }

    public function store(Request $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $validated = $request->validate([
            'expires_at' => 'nullable|date',
        ]);

        $session = $assessment->session()->create([
            'session_token' => Str::random(64),
            'consent_token' => 'NCS-' . strtoupper(Str::random(6)),
            'status' => 'pending',
            'started_at' => now(),
            'expires_at' => $validated['expires_at'] ?? now()->addHours(2),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Session created',
            'data' => new SessionResource($session),
        ], 201);
    }

    public function show(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $session = $assessment->session;

        if (!$session) {
            return response()->json(['success' => false, 'message' => 'Session not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new SessionResource($session),
        ]);
    }

    public function end(AssessmentSession $session)
    {
        $this->authorize('update', $session->assessment);

        $session->update([
            'status' => 'completed',
            'ended_at' => now(),
            'agent_status' => 'disconnected',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Session ended',
            'data' => new SessionResource($session->fresh()),
        ]);
    }
}
