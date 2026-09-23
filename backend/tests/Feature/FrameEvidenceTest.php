<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\AssessmentSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FrameEvidenceTest extends TestCase
{
    use RefreshDatabase;

    private function consentedSession(User $assessor): AssessmentSession
    {
        $session = AssessmentSession::factory()->create([
            'status' => 'active',
            'agent_status' => 'connected',
            'consent_given_at' => now(),
            'device_id' => 'DEV123',
            'last_seen_at' => now(),
        ]);
        $session->assessment->update([
            'assessor_id' => $assessor->id,
            'status' => 'active',
        ]);
        return $session;
    }

    private function agentHeaders(string $token): array
    {
        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_success_with_detection(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = $this->consentedSession($assessor);

        $resp = $this->actingAs($assessor)->postJson(
"/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        $resp = $this->withHeaders($this->agentHeaders($token))->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            [
                'device_id' => 'DEV123',
                'frame_number' => 1,
                'captured_at' => now()->toISOString(),
                'detections' => [['type' => 'object', 'label' => 'test', 'confidence' => 0.9]],
            ]
        );

        $resp->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['id', 'frame_number']]);

        $this->assertDatabaseHas('frame_evidence', [
            'session_id' => $session->id,
            'frame_number' => 1,
        ]);
        $evidence = \App\Models\FrameEvidence::where('session_id', $session->id)->first();
        $this->assertNotEmpty($evidence->metadata['detections']);
        $this->assertNull($evidence->metadata['png'] ?? null); // no PNG stored
    }

    public function test_empty_detection_rejected(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = $this->consentedSession($assessor);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        $this->withHeaders($this->agentHeaders($token))->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            [
                'device_id' => 'DEV123',
                'frame_number' => 1,
                'captured_at' => now()->toISOString(),
                'detections' => [],
            ]
        )->assertStatus(422);
    }

    public function test_invalid_agent_token(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = $this->consentedSession($assessor);

        $this->withHeaders([
            'Authorization' => 'Bearer fake_agent_token_xyz',
        ])->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            ['device_id' => 'DEV123', 'frame_number' => 1, 'detections' => [['type' => 'x']]]
        )->assertStatus(401);
    }

    public function test_consent_not_given(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
            'status' => 'active',
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id, 'status' => 'active']);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        // Consent dicabut setelah token issued
        $session->update(['consent_given_at' => null]);

        $this->withHeaders($this->agentHeaders($token))->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            ['device_id' => 'DEV123', 'frame_number' => 1, 'detections' => [['type' => 'x']]]
        )->assertStatus(403);
    }

    public function test_session_not_active(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
            'status' => 'pending',
            'agent_status' => 'connected',
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id, 'status' => 'active']);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        $this->withHeaders($this->agentHeaders($token))->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            ['device_id' => 'DEV123', 'frame_number' => 1, 'detections' => [['type' => 'x']]]
        )->assertStatus(403);
    }

    public function test_assessment_not_active(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
            'status' => 'active',
            'agent_status' => 'connected',
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id, 'status' => 'active']);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        // Now mark assessment as completed
        $session->assessment->update(['status' => 'completed']);

        $this->withHeaders($this->agentHeaders($token))->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            ['device_id' => 'DEV123', 'frame_number' => 1, 'detections' => [['type' => 'x']]]
        )->assertStatus(403);
    }

    public function test_session_not_found(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);

        $this->actingAs($assessor)
            ->postJson('/api/assessor/sessions/99999/agent/frames', [
                'device_id' => 'DEV123', 'frame_number' => 1, 'detections' => [['type' => 'x']],
            ])->assertStatus(404);
    }

    public function test_validation_missing_fields(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = $this->consentedSession($assessor);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/assessments/{$session->assessment_id}/agent/token"
        );
        $token = $resp->json('data.agent_token');

        $this->withHeaders($this->agentHeaders($token))->postJson(
            "/api/assessor/sessions/{$session->id}/agent/frames",
            []
        )->assertStatus(422);
    }
}
