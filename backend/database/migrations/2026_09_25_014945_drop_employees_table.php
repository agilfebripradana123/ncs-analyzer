<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropForeign(['employee_id']);
            $table->dropColumn('employee_id');
        });
        Schema::dropIfExists('employees');
    }

    public function down(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('employee_code')->unique();
            $table->string('department')->nullable();
            $table->timestamps();
        });
        Schema::table('assessments', function (Blueprint $table) {
            $table->foreignId('employee_id')->nullable()->constrained()->cascadeOnDelete()->after('assessor_id');
        });
    }
};