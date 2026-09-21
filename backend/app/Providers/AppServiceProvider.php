<?php

namespace App\Providers;

use App\Models\Assessment;
use App\Policies\AssessmentPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Assessment::class, AssessmentPolicy::class);
    }
}
