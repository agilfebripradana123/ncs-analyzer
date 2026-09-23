<?php

namespace Tests\Feature;

use App\Models\AssessmentSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HeartbeatTest extends TestCase
{
    use RefreshDatabase;

    private function connectedSession(User $assessor): AssessmentSession
    {
        $session = AssessmentSession::factory()->create([
            'device_id' => 'ABC123XYZ',
            'agent_status' => 'connected',
            'connected_at' => now(),
            'last_seen_at' => now(),
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);
        return $session;
    }

    public function test_heartbeat_success(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = $this->connectedSession($assessor);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/heartbeat",
            ['device_id' => 'ABC123XYZ']
        );

        $resp->assertOk()->assertJsonPath('success', true);
    }

    public function test_session_not_found(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);

        $resp = $this->actingAs($assessor)->postJson(
            '/api/assessor/sessions/99999/agent/heartbeat'
        );

        $resp->assertStatus(404);
    }

    public function test_authentication_fails(): void
    {
        $this->postJson('/api/assessor/sessions/1/agent/heartbeat')->assertStatus(401);
    }

    public function test_disconnected_agent_rejected(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'device_id' => 'ABC123XYZ',
            'agent_status' => 'disconnected',
            'connected_at' => now(),
            'last_seen_at' => now(),
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/heartbeat"
        );

        $resp->assertStatus(403);
    }

    public function test_terminal_session_rejected(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'device_id' => 'ABC123XYZ',
            'agent_status' => 'connected',
            'connected_at' => now(),
            'last_seen_at' => now(),
            'consent_given_at' => now(),
            'status' => 'completed',
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $resp = $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/heartbeat"
        );

        $resp->assertStatus(403);
    }

    public function test_stale_last_seen_marks_disconnected(): void
    {
        $assessor = User::factory()->create(['role' => 'assessor']);
        $session = AssessmentSession::factory()->create([
            'device_id' => 'ABC123XYZ',
            'agent_status' => 'connected',
            'connected_at' => now(),
            'last_seen_at' => now()->subMinutes(5),
            'consent_given_at' => now(),
        ]);
        $session->assessment->update(['assessor_id' => $assessor->id]);

        $this->actingAs($assessor)->postJson(
            "/api/assessor/sessions/{$session->id}/agent/heartbeat"
        )->assertStatus(403);

        $this->assertDatabaseHas('assessment_sessions', [
            'id' => $session->id,
            'agent_status' => 'disconnected',
        ]);
    }
}
