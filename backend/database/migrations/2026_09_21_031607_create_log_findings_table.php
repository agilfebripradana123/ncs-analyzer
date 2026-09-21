<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('log_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rule_id')->constrained('detection_rules')->restrictOnDelete();
            $table->string('type');
            $table->text('description')->nullable();
            $table->json('evidence')->nullable();
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->timestamp('detected_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_findings');
    }
};
