<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConsentUploadRequest;
use App\Jobs\ProcessActivityLog;
use App\Models\AssessmentSession;
use Illuminate\Http\Request;
use ZipArchive;

class ConsentController extends Controller
{
    public function upload(ConsentUploadRequest $request, $token)
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
        if ($session->status !== 'consented') {
            return response()->json(['message' => 'Consent harus disetujui terlebih dahulu'], 400);
        }

        $entries = $this->extractEntries($request->file('file'));

        ProcessActivityLog::dispatchSync($session->assessment, $entries);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diunggah dan dianalisis',
            'data' => ['entries_count' => count($entries)],
        ]);
    }

    /**
     * Parse uploaded activity data. Accepts a raw .json or a .zip (Google My Activity export).
     *
     * @return array<int, array<string, mixed>>
     */
    protected function extractEntries($file): array
    {
        $content = $file->get();
        $json = json_decode($content, true);

        // Flat JSON list of entries.
        if (is_array($json)) {
            return $json;
        }

        // Try to locate a JSON payload inside a zip (single My Activity file or nested dir).
        $entries = $this->extractFromZip($file->getRealPath());
        if ($entries !== null) {
            return $entries;
        }

        // Not JSON, not zip (or zip without JSON) — reject with a clear message.
        abort(422, 'File tidak berisi data aktivitas yang valid. Unggah file JSON atau ZIP hasil export Google My Activity.');
    }

    /**
     * @return array<int, array<string, mixed>>|null
     * @ponytail: only looks at zip entries whose basename is .json; nested dirs are scanned.
     */
    private function extractFromZip(string $path): ?array
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            return null;
        }

        $merged = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (str_ends_with(strtolower($name), '.json') && !str_contains($name, '/Google Play Store/')) {
                $decoded = json_decode($zip->getFromIndex($i), true);
                if (is_array($decoded)) {
                    $merged = array_merge($merged, $decoded);
                }
            }
        }
        $zip->close();

        return $merged === [] ? null : $merged;
    }

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
