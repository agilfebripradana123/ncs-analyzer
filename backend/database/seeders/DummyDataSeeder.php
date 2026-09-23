<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Assessment;
use App\Models\AuditLog;
use App\Models\AssessmentSession;
use App\Models\Consent;
use App\Models\DetectionRule;
use App\Models\Employee;
use App\Models\LogFinding;
use App\Models\RiskScore;
use App\Models\Report;
use App\Models\User;
use App\Models\VisualFinding;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $assessor = User::where('email', 'assessor@ncs-analyzer.test')->first();

        $employees = [
            ['employee_code' => 'EMP-001', 'name' => 'Budi Santoso', 'department' => 'IT Department', 'position' => 'Network Engineer'],
            ['employee_code' => 'EMP-002', 'name' => 'Siti Rahayu', 'department' => 'Finance', 'position' => 'Accountant'],
            ['employee_code' => 'EMP-003', 'name' => 'Ahmad Fauzi', 'department' => 'HRD', 'position' => 'HR Generalist'],
            ['employee_code' => 'EMP-004', 'name' => 'Dewi Lestari', 'department' => 'Marketing', 'position' => 'Digital Marketing'],
            ['employee_code' => 'EMP-005', 'name' => 'Rudi Hermawan', 'department' => 'IT Department', 'position' => 'System Admin'],
        ];

        foreach ($employees as $e) {
            Employee::updateOrCreate(['employee_code' => $e['employee_code']], $e);
        }

        $emp = Employee::pluck('id', 'employee_code')->toArray();

        // --- Assessment 1: completed ---
        $a1 = Assessment::updateOrCreate(
            ['title' => 'Audit Keamanan Bulanan - Budi Santoso'],
            [
                'employee_id' => $emp['EMP-001'],
                'assessor_id' => $assessor->id,
                'status' => 'completed',
                'started_at' => now()->subHours(2),
                'completed_at' => now()->subMinutes(30),
            ]
        );
        $a1->consent()->firstOrCreate([
            'status' => 'accepted',
            'consent_text' => 'Saya memberikan persetujuan untuk melakukan pemantauan aktivitas digital selama sesi penilaian keamanan. Data yang dikumpulkan akan digunakan untuk keperluan analisis risiko dan pelaporan internal.',
            'consented_at' => now()->subHours(2),
            'ip_address' => '192.168.1.10',
        ]);
        $a1->session()->firstOrCreate([
            'session_token' => Str::random(64),
            'status' => 'completed',
            'started_at' => now()->subHours(2),
            'expires_at' => now()->addHours(2),
            'ended_at' => now()->subMinutes(30),
        ]);

        $ruleUnauth = DetectionRule::where('name', 'Unauthorized App')->first();
        $ruleBlocked = DetectionRule::where('name', 'Blocked Domain')->first();

        foreach (['web', 'application', 'file', 'web', 'application'] as $i => $type) {
            ActivityLog::create([
                'assessment_id' => $a1->id,
                'activity_type' => $type,
                'activity_data' => ['title' => "Aktivitas $type #$i", 'url' => "https://example-$i.com", 'timestamp' => now()->subMinutes(90 - $i * 10)->toISOString()],
                'occurred_at' => now()->subMinutes(90 - $i * 10),
            ]);
        }

        VisualFinding::create([
            'assessment_id' => $a1->id, 'rule_id' => $ruleUnauth->id, 'type' => 'application',
            'description' => 'Aplikasi tidak sah terdeteksi: TeamViewer',
            'evidence' => ['app' => 'TeamViewer', 'confidence' => 0.95],
            'severity' => 'critical', 'detected_at' => now()->subMinutes(60),
        ]);
        VisualFinding::create([
            'assessment_id' => $a1->id, 'rule_id' => $ruleUnauth->id, 'type' => 'application',
            'description' => 'Aplikasi tidak sah terdeteksi: AnyDesk',
            'evidence' => ['app' => 'AnyDesk', 'confidence' => 0.89],
            'severity' => 'high', 'detected_at' => now()->subMinutes(50),
        ]);
        LogFinding::create([
            'assessment_id' => $a1->id, 'rule_id' => $ruleBlocked->id, 'type' => 'url',
            'description' => 'Domain terblokir diakses: example-blocked.com',
            'evidence' => ['url' => 'https://example-blocked.com/login', 'status' => 200],
            'severity' => 'high', 'detected_at' => now()->subMinutes(40),
        ]);
        LogFinding::create([
            'assessment_id' => $a1->id, 'rule_id' => $ruleBlocked->id, 'type' => 'keyword',
            'description' => 'Kata kunci mencurigakan ditemukan pada log',
            'evidence' => ['keyword' => 'password', 'context' => 'login attempt'],
            'severity' => 'medium', 'detected_at' => now()->subMinutes(30),
        ]);

        RiskScore::create([
            'assessment_id' => $a1->id, 'score' => 42.50, 'level' => 'medium',
            'calculation_data' => ['visual' => 2, 'log' => 2, 'critical' => 1, 'high' => 2, 'medium' => 1],
            'calculated_at' => now()->subMinutes(20),
        ]);
        Report::create([
            'assessment_id' => $a1->id,
            'summary' => 'Hasil audit menunjukkan risiko sedang. Ditemukan 2 aplikasi tidak sah dan 2 pelanggaran domain/kata kunci. Perlu tindakan lanjutan.',
            'total_findings' => 4,
            'generated_at' => now()->subMinutes(10),
        ]);

        // --- Assessment 2: active ---
        $a2 = Assessment::updateOrCreate(
            ['title' => 'Audit Harian - Siti Rahayu'],
            [
                'employee_id' => $emp['EMP-002'],
                'assessor_id' => $assessor->id,
                'status' => 'active',
                'started_at' => now()->subMinutes(30),
            ]
        );
        $a2->consent()->firstOrCreate([
            'status' => 'accepted',
            'consent_text' => 'Persetujuan pemantauan aktivitas digital selama penilaian.',
            'consented_at' => now()->subMinutes(25),
            'ip_address' => '192.168.1.20',
        ]);
        $a2->session()->firstOrCreate([
            'session_token' => Str::random(64),
            'status' => 'active',
            'started_at' => now()->subMinutes(30),
            'expires_at' => now()->addHours(1),
        ]);
        ActivityLog::create([
            'assessment_id' => $a2->id, 'activity_type' => 'web',
            'activity_data' => ['title' => 'Halaman dashboard', 'url' => 'https://internal.ncs/test', 'timestamp' => now()->toISOString()],
            'occurred_at' => now()->subMinutes(10),
        ]);
        ActivityLog::create([
            'assessment_id' => $a2->id, 'activity_type' => 'application',
            'activity_data' => ['title' => 'Buka file Excel', 'timestamp' => now()->subMinutes(5)->toISOString()],
            'occurred_at' => now()->subMinutes(5),
        ]);
        VisualFinding::firstOrCreate(
            ['assessment_id' => $a2->id, 'type' => 'application'],
            [
                'rule_id' => $ruleUnauth->id,
                'description' => 'TimViewer terdeteksi sesi aktif',
                'evidence' => ['app' => 'TeamViewer', 'confidence' => 0.72],
                'severity' => 'medium', 'detected_at' => now()->subMinutes(3),
            ]
        );
        LogFinding::firstOrCreate(
            ['assessment_id' => $a2->id, 'type' => 'url'],
            [
                'rule_id' => $ruleBlocked->id,
                'description' => 'Akses domain terblokir sementara',
                'evidence' => ['url' => 'https://example-blocked.com', 'status' => 403],
                'severity' => 'low', 'detected_at' => now()->subMinutes(2),
            ]
        );

        // --- Assessment 3: consent stage (no consent row, no session) ---
        Assessment::updateOrCreate(
            ['title' => 'Pra-Audit - Ahmad Fauzi'],
            [
                'employee_id' => $emp['EMP-003'],
                'assessor_id' => $assessor->id,
                'status' => 'consented',
            ]
        );

        // --- Audit logs ---
        AuditLog::create([
            'user_id' => User::where('email', 'admin@ncs-analyzer.test')->first()->id,
            'action' => 'LOGIN', 'description' => 'Admin login ke dashboard',
            'entity_type' => 'user', 'entity_id' => null, 'ip_address' => '10.0.0.1',
        ]);
        AuditLog::create([
            'user_id' => $assessor->id,
            'action' => 'CREATE', 'description' => 'Assessor memulai assessment baru',
            'entity_type' => 'assessment', 'entity_id' => $a1->id, 'ip_address' => '10.0.0.2',
        ]);
        AuditLog::create([
            'user_id' => $assessor->id,
            'action' => 'VIEW', 'description' => 'Assessor melihat laporan hasil audit',
            'entity_type' => 'report', 'entity_id' => Report::where('assessment_id', $a1->id)->first()->id,
            'ip_address' => '10.0.0.2',
        ]);
    }
}
