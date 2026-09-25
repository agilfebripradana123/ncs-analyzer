<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->string('employee_name', 150)->nullable()->after('employee_id');
            $table->string('employee_department', 150)->nullable()->after('employee_name');
            $table->text('description')->nullable()->after('employee_department');
            $table->foreignId('employee_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn(['employee_name', 'employee_department', 'description']);
            // employee_id remains nullable after rollback - not reverting to NOT NULL to avoid breaking
        });
    }
};
