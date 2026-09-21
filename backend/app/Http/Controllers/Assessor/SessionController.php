<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionResource;
use App\Models\Assessment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    public function store(Request $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $validated = $request->validate([
            'expires_at' => 'nullable|date',
        ]);

        $session = $assessment->session()->create([
            'session_token' => Str::random(64),
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
}
