<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\DetectionRuleController;

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Assessor\ActivityController;
use App\Http\Controllers\Assessor\AgentController;
use App\Http\Controllers\Assessor\AssessmentController;
use App\Http\Controllers\Assessor\ConsentController;
use App\Http\Controllers\Assessor\FindingController;
use App\Http\Controllers\Assessor\ReportController;
use App\Http\Controllers\Assessor\RiskScoreController;
use App\Http\Controllers\Assessor\SessionController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/consent/{token}', [\App\Http\Controllers\ConsentController::class, 'show']);
Route::post('/consent/{token}/approve', [\App\Http\Controllers\ConsentController::class, 'approve']);
Route::post('/consent/{token}/decline', [\App\Http\Controllers\ConsentController::class, 'decline']);
Route::post('/consent/{token}/upload', [\App\Http\Controllers\ConsentController::class, 'upload']);

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware(['role:admin', 'audit'])->prefix('admin')->group(function () {
        Route::apiResource('users', UserController::class);

        Route::apiResource('rules', DetectionRuleController::class);
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('dashboard/stats', [\App\Http\Controllers\Admin\DashboardController::class, 'stats']);
    });

    Route::middleware(['role:assessor', 'audit'])->prefix('assessor')->group(function () {
        Route::get('findings', [\App\Http\Controllers\Assessor\FindingController::class, 'all']);
        Route::get('sessions', [\App\Http\Controllers\Assessor\SessionController::class, 'index']);

        Route::apiResource('assessments', AssessmentController::class);
        Route::post('assessments/{assessment}/start', [AssessmentController::class, 'start']);
        Route::post('assessments/{assessment}/complete', [AssessmentController::class, 'complete']);

        Route::post('assessments/{assessment}/consent', [ConsentController::class, 'store']);
        Route::get('assessments/{assessment}/consent', [ConsentController::class, 'show']);

        Route::post('assessments/{assessment}/session', [SessionController::class, 'store']);
        Route::get('assessments/{assessment}/session', [SessionController::class, 'show']);
        Route::post('assessments/{assessment}/agent/token', [AgentController::class, 'issueToken']);
        Route::post('sessions/{session}/end', [SessionController::class, 'end']);

        // Agent endpoints - can use agent token or Sanctum
        Route::post('sessions/{session}/agent/register', [AgentController::class, 'register']);
        Route::post('sessions/{session}/agent/heartbeat', [AgentController::class, 'heartbeat']);
        Route::post('sessions/{session}/agent/frames', [AgentController::class, 'frame']);

        Route::post('assessments/{assessment}/activity/upload', [ActivityController::class, 'upload']);
        Route::get('assessments/{assessment}/activities', [ActivityController::class, 'index']);
        Route::post('assessments/{assessment}/activities/reprocess', [ActivityController::class, 'reprocess']);

        Route::get('assessments/{assessment}/findings', [FindingController::class, 'index']);
        Route::get('assessments/{assessment}/visual-findings', [FindingController::class, 'visual']);
        Route::get('assessments/{assessment}/log-findings', [FindingController::class, 'log']);

        Route::get('assessments/{assessment}/risk-score', [RiskScoreController::class, 'show']);
        Route::post('assessments/{assessment}/risk-score/calculate', [RiskScoreController::class, 'calculate']);

        Route::get('reports', [\App\Http\Controllers\Assessor\ReportController::class, 'index']);
        Route::post('assessments/{assessment}/report', [ReportController::class, 'generate']);
        Route::get('assessments/{assessment}/report', [ReportController::class, 'show']);
    });
});
