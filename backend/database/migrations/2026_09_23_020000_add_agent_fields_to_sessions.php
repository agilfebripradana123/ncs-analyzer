<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_sessions', function (Blueprint $table) {
            $table->string('device_id')->nullable()->after('consent_token');
            $table->enum('agent_status', ['disconnected', 'connected'])->default('disconnected')->after('device_id');
            $table->timestamp('connected_at')->nullable()->after('agent_status');
            $table->timestamp('last_seen_at')->nullable()->after('connected_at');
        });
    }

    public function down(): void
    {
        Schema::table('assessment_sessions', function (Blueprint $table) {
            $table->dropColumn(['device_id', 'agent_status', 'connected_at', 'last_seen_at']);
        });
    }
};
