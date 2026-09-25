<?php

namespace Database\Factories;

use App\Models\Assessment;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssessmentFactory extends Factory
{
    protected $model = Assessment::class;

    public function definition(): array
    {
        return [
            'employee_name' => fake()->name(),
            'employee_department' => fake()->randomElement(['IT', 'Finance', 'HR', 'Marketing']),
            'assessor_id' => User::factory()->state(['role' => 'assessor']),
            'title' => fake()->sentence(3),
            'status' => 'active',
        ];
    }

    public function pendingConsent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function consented(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }
}
