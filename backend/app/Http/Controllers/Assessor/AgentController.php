<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessFrameDetections;
use App\Models\Assessment;
use App\Models\AssessmentSession;
use App\Models\FrameEvidence;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    public const STALE_AFTER_MINUTES = 2;

    public function issueToken(Request $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $session = $assessment->session;
        if (!$session) {
            return response()->json(['success' => false, 'message' => 'Session belum dibuat'], 404);
        }

        if (is_null($session->consent_given_at)) {
            return response()->json(['success' => false, 'message' => 'Consent belum diberikan'], 403);
        }

        if ($assessment->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Assessment belum dimulai'], 403);
        }

        $assessor = $assessment->assessor;
        $name = 'agent-' . $session->id;
        $assessor->tokens()->where('name', $name)->delete();
        $token = $assessor->createToken($name);

        $session->update(['agent_token_hash' => hash('sha256', $token->plainTextToken)]);

        return response()->json([
            'success' => true,
            'message' => 'Agent token issued',
            'data' => [
                'session_id' => $session->id,
                'agent_token' => $token->plainTextToken,
                'api_url' => rtrim(config('app.url'), '/') . '/api',
            ],
        ]);
    }

    public function register(Request $request, AssessmentSession $session)
    {
        $this->guard($request, $session);

        $request->validate([
            'device_id' => 'required|string|max:100',
        ]);

        if (is_null($session->consent_given_at)) {
            return response()->json(['success' => false, 'message' => 'Consent belum diberikan'], 403);
        }

        $session->update([
            'device_id' => $request->input('device_id'),
            'agent_status' => 'connected',
            'connected_at' => $session->connected_at ?? now(),
            'last_seen_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Agent registered',
            'data' => $session->fresh(),
        ]);
    }

    public function heartbeat(Request $request, AssessmentSession $session)
    {
        $this->guard($request, $session);

        if ($this->isStale($session)) {
            $session->update(['agent_status' => 'disconnected']);
            return response()->json(['success' => false, 'message' => 'Agent timeout: disconnected'], 403);
        }

        if ($session->agent_status !== 'connected') {
            return response()->json(['success' => false, 'message' => 'Agent tidak aktif'], 403);
        }

        if (in_array($session->status, ['completed', 'expired', 'cancelled'], true)) {
            return response()->json(['success' => false, 'message' => 'Session sudah berakhir'], 403);
        }

        $session->update(['last_seen_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Heartbeat received']);
    }

    public function frame(Request $request, AssessmentSession $session)
    {
        $this->guard($request, $session);

$validated = $request->validate([
            'device_id' => 'required|string|max:100',
            'frame_number' => 'required|integer|min:1',
            'detections' => 'required|array|min:1',
            'captured_at' => 'nullable|date',
        ]);

        if (is_null($session->consent_given_at)) {
            return response()->json(['success' => false, 'message' => 'Consent belum diberikan'], 403);
        }

        if ($session->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Session tidak aktif'], 403);
        }

        $assessment = $session->assessment;

        if ($assessment->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Assessment tidak aktif'], 403);
        }

        $capturedAt = $validated['captured_at'] ?? now();
        if (is_string($capturedAt)) {
            $capturedAt = \Carbon\Carbon::parse($capturedAt);
        }

        $evidence = $assessment->frameEvidence()->create([
            'session_id' => $session->id,
            'device_id' => $validated['device_id'],
            'frame_number' => $validated['frame_number'],
            'metadata' => [
                'captured_at' => $capturedAt->toISOString(),
                'detections' => $validated['detections'],
            ],
            'captured_at' => $capturedAt,
        ]);

        ProcessFrameDetections::dispatchSync($assessment, $validated['detections'], $evidence->id);

        return response()->json([
            'success' => true,
            'message' => 'Frame evidence saved',
            'data' => [
                'id' => $evidence->id,
                'frame_number' => $evidence->frame_number,
            ],
        ]);
    }

    public static function markStaleSessions(): void
    {
        $threshold = now()->subMinutes(self::STALE_AFTER_MINUTES);
        AssessmentSession::where('agent_status', 'connected')
            ->where(function ($q) use ($threshold) {
                $q->where('last_seen_at', '<', $threshold)->orWhereNull('last_seen_at');
            })
            ->update(['agent_status' => 'disconnected']);
    }

    private function guard(Request $request, AssessmentSession $session): void
    {
        $bearer = $request->bearerToken();
        if ($bearer !== null) {
            if (!$this->tokenMatches($request, $session)) {
                abort(401, 'Agent token tidak valid untuk session ini');
            }
            return;
        }
        $this->authorize('view', $session->assessment);
    }

    private function tokenMatches(Request $request, AssessmentSession $session): bool
    {
        $bearer = $request->bearerToken();
        if (!$bearer) {
            return false;
        }
        $hash = $session->agent_token_hash;
        if (!$hash) {
            return false;
        }
        return hash_equals($hash, hash('sha256', $bearer));
    }

    private function isStale(AssessmentSession $session): bool
    {
        return is_null($session->last_seen_at)
            || $session->last_seen_at->lt(now()->subMinutes(self::STALE_AFTER_MINUTES));
    }
}
