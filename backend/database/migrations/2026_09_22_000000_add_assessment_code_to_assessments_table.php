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
            $table->string('assessment_code')->unique()->nullable()->after('title');
        });

        DB::table('assessments')->whereNull('assessment_code')->update([
            'assessment_code' => DB::raw("CONCAT('ASS-', LPAD(id, 5, '0'))"),
        ]);
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn('assessment_code');
        });
    }
};
