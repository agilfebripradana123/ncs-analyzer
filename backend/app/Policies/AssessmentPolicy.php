<?php

namespace App\Policies;

use App\Models\Assessment;
use App\Models\User;

class AssessmentPolicy
{
    public function view(User $user, Assessment $assessment): bool
    {
        return $user->role === 'admin' || $assessment->assessor_id === $user->id;
    }

    public function update(User $user, Assessment $assessment): bool
    {
        return $assessment->assessor_id === $user->id;
    }

    public function delete(User $user, Assessment $assessment): bool
    {
        return $assessment->assessor_id === $user->id;
    }
}
