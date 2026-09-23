<?php

namespace Tests\Feature;

use App\Models\AssessmentSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_issue_token_success(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );

        $resp->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['session_id', 'agent_token']]);

        $this->assertNotNull($session->fresh()->agent_token_hash);
    }

    public function test_issue_token_consent_not_given(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => null,
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        )->assertStatus(403);
    }

    public function test_issue_token_unauthorized(): void
    {
        $assessorA = User::factory()->create(['role' => 'assessor']);
        $assessorB = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessorA->id]);

        $this->actingAs($assessorB)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        )->assertStatus(403);
    }

    public function test_register_with_agent_token(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        // Issue token
        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        // Register using agent token (no Sanctum auth)
        $resp = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->postJson(
            "/api/assessor/sessions/{$session->id}/agent/register",
            ['device_id' => 'DEV999']
        );

        $resp->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('assessment_sessions', [
            'id' => $session->id,
            'device_id' => 'DEV999',
            'agent_status' => 'connected',
        ]);
    }

    public function test_heartbeat_with_agent_token(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
            'agent_status' => 'connected',
            'last_seen_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        $resp = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->postJson(
            "/api/assessor/sessions/{$session->id}/agent/heartbeat"
        );

        $resp->assertOk()->assertJsonPath('success', true);
    }

    public function test_invalid_agent_token_rejected(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $this->withHeaders([
            'Authorization' => 'Bearer invalid_token_xyz',
        ])->postJson(
            "/api/assessor/sessions/{$session->id}/agent/register",
            ['device_id' => 'DEV999']
        )->assertStatus(401);
    }
}
