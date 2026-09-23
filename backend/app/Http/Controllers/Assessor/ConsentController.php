<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConsentResource;
use App\Models\Assessment;
use Illuminate\Http\Request;

class ConsentController extends Controller
{
    public function store(Request $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $validated = $request->validate([
            'status' => 'required|in:accepted,rejected',
            'consent_text' => 'required|string',
        ]);

        $consent = $assessment->consent()->create([
            ...$validated,
            'consented_at' => now(),
            'ip_address' => $request->ip(),
        ]);

        $assessment->update(['status' => 'consented']);

        return response()->json([
            'success' => true,
            'message' => 'Consent recorded',
            'data' => new ConsentResource($consent),
        ], 201);
    }

    public function show(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $consent = $assessment->consent;

        if (!$consent) {
            return response()->json(['success' => false, 'message' => 'Consent not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ConsentResource($consent),
        ]);
    }
}
