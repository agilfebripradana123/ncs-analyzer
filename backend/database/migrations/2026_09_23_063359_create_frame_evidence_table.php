<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frame_evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->constrained('assessment_sessions')->cascadeOnDelete();
            $table->string('device_id', 100);
            $table->unsignedBigInteger('frame_number');
            $table->json('metadata')->nullable();
            $table->timestamp('captured_at');
            $table->timestamps();

            $table->index(['assessment_id', 'captured_at']);
            $table->index(['session_id', 'frame_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frame_evidence');
    }
};
