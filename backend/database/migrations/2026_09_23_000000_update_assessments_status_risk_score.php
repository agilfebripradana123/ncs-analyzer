<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->string('title')->nullable()->change();
            $table->string('status', 20)->default('pending_consent')->change();
        });

        DB::table('assessments')
            ->where('status', 'consent')
            ->update(['status' => 'consented']);
        DB::table('assessments')
            ->where('status', 'pending')
            ->update(['status' => 'pending_consent']);

        Schema::table('assessments', function (Blueprint $table) {
            $table->enum('status', [
                'pending_consent', 'consented', 'active', 'processing', 'completed', 'cancelled', 'expired'
            ])->default('pending_consent')->change();
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->change();
        });

        DB::table('assessments')
            ->where('status', 'consented')
            ->update(['status' => 'consent']);
        DB::table('assessments')
            ->where('status', 'pending_consent')
            ->update(['status' => 'pending']);

        Schema::table('assessments', function (Blueprint $table) {
            $table->enum('status', ['pending', 'consent', 'active', 'processing', 'completed', 'cancelled', 'expired'])->default('pending')->change();
        });
    }
};