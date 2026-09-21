<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::where('email', 'admin@ncsanalyzer.local')->delete();

        User::updateOrCreate(
            ['email' => 'admin@ncs-analyzer.test'],
            ['name' => 'Administrator', 'password' => Hash::make('Admin123!'), 'role' => 'admin', 'status' => 'active']
        );

        User::updateOrCreate(
            ['email' => 'assessor@ncs-analyzer.test'],
            ['name' => 'Assessor', 'password' => Hash::make('Assessor123!'), 'role' => 'assessor', 'status' => 'active']
        );
    }
}
