<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judi_corpus', function (Blueprint $table) {
            $table->id();
            $table->text('text');
            $table->boolean('label');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judi_corpus');
    }
};