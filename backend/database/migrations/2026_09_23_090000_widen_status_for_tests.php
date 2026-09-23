<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Test-only migration: widen status columns to plain string so 'consented' /
 * 'pending_consent' are accepted in SQLite test DB. Production MySQL uses the
 * proper enum migrations (2026_09_23_000000 / 2026_09_23_010100).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            return;
        }
        Schema::table('assessments', function (Blueprint $table) {
            $table->string('status', 20)->default('pending_consent')->change();
        });
        Schema::table('assessment_sessions', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }

    public function down(): void
    {
        // noop — SQLite test DB is recreated fresh per test run
    }
};