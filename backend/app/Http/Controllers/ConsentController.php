<?php

namespace App\Http\Controllers;

use App\Models\AssessmentSession;
use Illuminate\Http\Request;

class ConsentController extends Controller
{
    public function show($token)
    {
        $session = AssessmentSession::with(['assessment.assessor'])
            ->where('consent_token', $token)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Token consent tidak valid atau sudah kadaluarsa'], 404);
        }

        if ($session->expires_at && $session->expires_at->isPast()) {
            return response()->json(['message' => 'Token consent sudah kadaluarsa'], 410);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'session_code' => $token,
                'assessment_code' => $session->assessment->assessment_code,
                'employee' => [
                    'name' => $session->assessment->employee_name,
                    'department' => $session->assessment->employee_department,
                ],
                'assessor' => [
                    'name' => $session->assessment->assessor->name,
                ],
                'expires_at' => $session->expires_at?->toISOString(),
            ],
        ]);
    }

    public function approve(Request $request, $token)
    {
        $session = AssessmentSession::with('assessment')
            ->where('consent_token', $token)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Token tidak valid'], 404);
        }

        if ($session->expires_at && $session->expires_at->isPast()) {
            return response()->json(['message' => 'Token sudah kadaluarsa'], 410);
        }

        if ($session->status !== 'pending') {
            return response()->json(['message' => 'Consent sudah diproses sebelumnya'], 400);
        }

        $session->update([
            'status' => 'consented',
            'consent_given_at' => now(),
            'consent_ip' => $request->ip(),
            'consent_user_agent' => $request->userAgent(),
        ]);

        $session->assessment->update(['status' => 'consented']);

        $session->assessment->consent()->updateOrCreate(
            ['assessment_id' => $session->assessment_id],
            [
                'status' => 'accepted',
                'consent_text' => 'Saya telah membaca dan memahami ketentuan assessment.',
                'consented_at' => now(),
                'ip_address' => $request->ip(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Persetujuan diterima',
        ]);
    }

    public function decline(Request $request, $token)
    {
        $session = AssessmentSession::with('assessment')
            ->where('consent_token', $token)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Token tidak valid'], 404);
        }

        if ($session->status !== 'pending') {
            return response()->json(['message' => 'Consent sudah diproses'], 400);
        }

        $session->update(['status' => 'cancelled']);
        $session->assessment->update(['status' => 'cancelled']);

        $session->assessment->consent()->updateOrCreate(
            ['assessment_id' => $session->assessment_id],
            [
                'status' => 'rejected',
                'consent_text' => 'Consent ditolak oleh karyawan.',
                'consented_at' => now(),
                'ip_address' => $request->ip(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Persetujuan ditolak',
        ]);
    }
}
