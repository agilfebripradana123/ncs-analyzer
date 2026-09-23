<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_sessions', function (Blueprint $table) {
            $table->string('consent_token', 64)->unique()->nullable()->after('session_token');
            $table->string('consent_ip', 45)->nullable()->after('consent_token');
            $table->string('consent_user_agent')->nullable()->after('consent_ip');
            $table->timestamp('consent_given_at')->nullable()->after('consent_user_agent');
        });
    }

    public function down(): void
    {
        Schema::table('assessment_sessions', function (Blueprint $table) {
            $table->dropColumn(['consent_token', 'consent_ip', 'consent_user_agent', 'consent_given_at']);
        });
    }
};
