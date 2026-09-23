<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_sessions', function (Blueprint $table) {
            $table->enum('status', [
                'pending', 'consented', 'active', 'processing',
                'disconnected', 'completed', 'cancelled', 'expired',
            ])->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('assessment_sessions', function (Blueprint $table) {
            $table->enum('status', ['pending', 'active', 'disconnected', 'completed', 'expired'])->default('pending')->change();
        });
    }
};