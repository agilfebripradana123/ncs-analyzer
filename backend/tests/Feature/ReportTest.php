<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\DetectionRule;
use App\Models\LogFinding;
use App\Models\RiskScore;
use App\Models\User;
use App\Models\VisualFinding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private function makeAssessmentWithFindings(User $assessor, array $visualSev, array $logSev): Assessment
    {
        $assessment = Assessment::factory()->create(['assessor_id' => $assessor->id, 'status' => 'active']);

        $visualRule = DetectionRule::create([
            'name' => 'Judi Online', 'rule_config' => ['keywords' => ['slot']],
            'severity' => 'critical', 'status' => 'active',
        ]);
        $logRule = DetectionRule::create([
            'name' => 'Judi Online (Similarity)', 'rule_config' => ['matcher' => 'similarity'],
            'severity' => 'high', 'status' => 'active',
        ]);

        foreach ($visualSev as $sev) {
            VisualFinding::create([
                'assessment_id' => $assessment->id, 'rule_id' => $visualRule->id, 'type' => 'Judi Online',
                'description' => 'Detected slot', 'evidence' => ['detection' => ['label' => 'slot']],
                'severity' => $sev, 'detected_at' => now(),
            ]);
        }
        foreach ($logSev as $sev) {
            LogFinding::create([
                'assessment_id' => $assessment->id, 'rule_id' => $logRule->id, 'type' => 'Judi Online (Similarity)',
                'description' => 'Detected judi similarity', 'evidence' => ['data' => ['url' => 'http://judi.com']],
                'severity' => $sev, 'detected_at' => now(),
            ]);
        }

        return $assessment;
    }

    public function test_generate_report_success(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $assessment = $this->makeAssessmentWithFindings($assessor, ['critical', 'critical', 'critical'], ['high', 'high']);

        RiskScore::create([
            'assessment_id' => $assessment->id, 'score' => 51, 'level' => 'critical',
            'calculation_data' => [], 'calculated_at' => now(),
        ]);

        $resp = $this->actingAs($assessor)->postJson("/api/assessor/assessments/{$assessment->id}/report");

        $resp->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_findings', 5)
            ->assertJsonPath('data.summary.risk_score', 51)
            ->assertJsonPath('data.summary.risk_level', 'critical')
            ->assertJsonPath('data.summary.visual_findings_count', 3)
            ->assertJsonPath('data.summary.log_findings_count', 2);

        $this->assertDatabaseHas('reports', ['assessment_id' => $assessment->id, 'total_findings' => 5]);
    }

    public function test_show_report_success(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $assessment = $this->makeAssessmentWithFindings($assessor, ['medium'], ['low']);

        RiskScore::create([
            'assessment_id' => $assessment->id, 'score' => 8, 'level' => 'medium',
            'calculation_data' => [], 'calculated_at' => now(),
        ]);
        $assessment->report()->create([
            'summary' => json_encode(['risk_score' => 8, 'risk_level' => 'medium']),
            'total_findings' => 2, 'generated_at' => now(),
        ]);

        $resp = $this->actingAs($assessor)->getJson("/api/assessor/assessments/{$assessment->id}/report");

        $resp->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.report.total_findings', 2)
            ->assertJsonPath('data.report.summary.risk_score', 8)
            ->assertJsonPath('data.report.summary.risk_level', 'medium')
            ->assertJsonPath('data.risk_score.level', 'medium')
            ->assertJsonCount(1, 'data.visual_findings')
            ->assertJsonCount(1, 'data.log_findings');
    }

    public function test_show_report_not_generated(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $assessment = Assessment::factory()->create(['assessor_id' => $assessor->id]);

        $this->actingAs($assessor)->getJson("/api/assessor/assessments/{$assessment->id}/report")
            ->assertNotFound()->assertJsonPath('success', false);
    }

    public function test_generate_report_unauthorized(): void
    {
        $assessorA = User::factory()->create(['role' => 'assessor']);
        $assessorB = User::factory()->create(['role' => 'assessor']);
        $assessment = Assessment::factory()->create(['assessor_id' => $assessorA->id]);

        $this->actingAs($assessorB)->postJson("/api/assessor/assessments/{$assessment->id}/report")
            ->assertStatus(403);
    }
}