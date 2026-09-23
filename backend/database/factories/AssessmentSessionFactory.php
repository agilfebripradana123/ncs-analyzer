<?php

namespace Database\Factories;

use App\Models\Assessment;
use App\Models\AssessmentSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class AssessmentSessionFactory extends Factory
{
    protected $model = AssessmentSession::class;

    public function definition(): array
    {
        return [
            'assessment_id' => Assessment::factory(),
            'session_token' => Str::random(64),
            'consent_token' => 'NCS-' . strtoupper(Str::random(6)),
            'status' => 'active',
            'agent_status' => 'disconnected',
            'started_at' => now(),
            'expires_at' => now()->addHours(2),
            'consent_given_at' => now(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'consent_given_at' => null,
        ]);
    }

    public function consented(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'consent_given_at' => now(),
        ]);
    }
}
