<?php

namespace Tests\Feature;

use App\Models\AssessmentSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentRegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_success(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'device_id' => null,
            'agent_status' => 'disconnected',
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/register",
            ['device_id' => 'ABC123XYZ']
        );

        $resp->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('assessment_sessions', [
            'id' => $session->id,
            'device_id' => 'ABC123XYZ',
            'agent_status' => 'connected',
        ]);
    }

    public function test_consent_not_given(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => null,
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/register",
            ['device_id' => 'ABC123XYZ']
        );

        $resp->assertStatus(403);
    }

    public function test_unauthorized_assessor(): void
    {
        $assessorA = User::factory()->create(['role' => 'assessor']);
        $assessorB = User::factory()->create(['role' => 'assessor']);
        // session owned by assessor A
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessorA->id]);

        $resp = $this->actingAs($assessorB)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/register",
            ['device_id' => 'ABC123XYZ']
        );

        $resp->assertStatus(403);
    }

    public function test_session_not_found(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/99999/agent/register",
            ['device_id' => 'ABC123XYZ']
        );

        $resp->assertStatus(404);
    }

    public function test_validation_error(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/register",
            []
        );

        $resp->assertStatus(422);
    }
}
