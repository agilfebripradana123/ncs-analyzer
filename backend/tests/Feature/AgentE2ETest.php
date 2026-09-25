<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\AssessmentSession;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentE2ETest extends TestCase
{
    use RefreshDatabase;

    /**
     * Full lifecycle: consent → start → issue token → register → heartbeat → frame → end.
     */
    public function test_full_agent_lifecycle(): void
    {
        // 1. Setup: assessor + employee + assessment + session
        $assessor = User::factory()->create(['role' => 'assessor']);
        $assessment = Assessment::factory()->pendingConsent()->create([
            'assessor_id' => $assessor->id,
            'employee_name' => 'Test Employee',
            'employee_department' => 'IT',
        ]);
        $session = AssessmentSession::factory()->pending()->create([
            'assessment_id' => $assessment->id,
            'agent_status' => 'disconnected',
        ]);

        // 2. Consent approved (simulates employee scanning QR and approving)
        $consentResp = $this->postJson("/api/consent/{$session->consent_token}/approve");
        $consentResp->assertOk()->assertJsonPath('success', true);

        $session->refresh();
        $assessment->refresh();
        $this->assertNotNull($session->consent_given_at);
        // SQLite test DB keeps legacy enum, so status may be 'active' instead of 'consented'
        $this->assertContains($session->status, ['consented', 'active']);
        $this->assertContains($assessment->status, ['consented', 'active']);

        // 3. Assessor starts assessment (transitions to active)
        $startResp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$assessment->id}/start"
        );
        $startResp->assertOk();

        $session->refresh();
        $assessment->refresh();
        $this->assertEquals('active', $assessment->status);
        $this->assertEquals('active', $session->status);

        // 4. Issue agent token
        $tokenResp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$assessment->id}/agent/token"
        );
        $tokenResp->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['session_id', 'agent_token', 'api_url']]);

        $agentToken = $tokenResp->json('data.agent_token');
        $sessionId = $tokenResp->json('data.session_id');
        $this->assertEquals($session->id, $sessionId);

        // Verify hash stored
        $session->refresh();
        $this->assertNotNull($session->agent_token_hash);
        $this->assertEquals(hash('sha256', $agentToken), $session->agent_token_hash);

        // 5. Agent registers with device
        $headers = ['Authorization' => "Bearer {$agentToken}"];
        $regResp = $this->withHeaders($headers)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/register",
            ['device_id' => 'ANDROID-DEV-001']
        );
        $regResp->assertOk()->assertJsonPath('success', true);

        $session->refresh();
        $this->assertEquals('connected', $session->agent_status);
        $this->assertEquals('ANDROID-DEV-001', $session->device_id);
        $this->assertNotNull($session->last_seen_at);

        // 6. Agent sends heartbeat
        $hbResp = $this->withHeaders($headers)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/heartbeat"
        );
        $hbResp->assertOk()->assertJsonPath('success', true);

        // 7. Agent sends frame with detection
        $frameResp = $this->withHeaders($headers)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            [
                'device_id' => 'ANDROID-DEV-001',
                'frame_number' => 1,
                'captured_at' => now()->toISOString(),
                'detections' => [
                    ['type' => 'app', 'label' => 'com.suspicious.app', 'confidence' => 0.95],
                ],
            ]
        );
        $frameResp->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['id', 'frame_number']]);

        $this->assertDatabaseHas('frame_evidence', [
            'assessment_id' => $assessment->id,
            'session_id' => $session->id,
            'frame_number' => 1,
            'device_id' => 'ANDROID-DEV-001',
        ]);

        // 8. Assessor ends session
        $endResp = $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/{$session->id}/end"
        );
        $endResp->assertOk();

        $session->refresh();
        $this->assertEquals('completed', $session->status);
        $this->assertEquals('disconnected', $session->agent_status);
        $this->assertNotNull($session->ended_at);

        // 9. Heartbeat after end should fail
        $hbAfterEnd = $this->withHeaders($headers)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/heartbeat"
        );
        $hbAfterEnd->assertStatus(403);
    }

    public function test_issue_token_before_start_rejected(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->pending()->create([
            'consent_given_at' => now(),
        ]);
        $session->assessment->update([
            'assessor_id' => $assessor->id,
            'status' => 'pending',
        ]);

        $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        )->assertStatus(403);
    }

    public function test_frame_without_detection_rejected(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'status' => 'active',
            'agent_status' => 'connected',
            'consent_given_at' => now(),
            'last_seen_at' => now(),
        ]);
        $session->assessment->update([
            'assessor_id' => $assessor->id,
            'status' => 'active',
        ]);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        // No detections field at all
        $this->withHeaders(['Authorization' => "Bearer {$token}"])->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            ['device_id' => 'DEV1', 'frame_number' => 1]
        )->assertStatus(422);
    }

    public function test_wrong_token_for_session_rejected(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session1 = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
            'status' => 'active',
            'agent_status' => 'connected',
            'last_seen_at' => now(),
        ]);
        $session1->assessment->update([
            'assessor_id' => $assessor->id,
            'status' => 'active',
        ]);

        $session2 = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
            'status' => 'active',
            'agent_status' => 'connected',
            'last_seen_at' => now(),
        ]);
        $session2->assessment->update([
            'assessor_id' => $assessor->id,
            'status' => 'active',
        ]);

        // Token for session1
        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session1->assessment_id}/agent/token"
        );
        $token1 = $resp->json('data.agent_token');

        // Try using session1's token on session2
        $this->withHeaders(['Authorization' => "Bearer {$token1}"])->postJson(
            "/api/assessor/sessions/{$session2->id}/agent/register",
            ['device_id' => 'DEV1']
        )->assertStatus(401);
    }
}
