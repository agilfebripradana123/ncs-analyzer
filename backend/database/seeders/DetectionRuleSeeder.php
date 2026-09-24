<?php

namespace Database\Seeders;

use App\Models\DetectionRule;
use Illuminate\Database\Seeder;

class DetectionRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            [
                'name' => 'Blocked Domain',
                'type' => 'log',
                'severity' => 'high',
                'rule_config' => ['domains' => ['example-blocked.com']],
            ],
            [
                'name' => 'Remote Access App',
                'type' => 'visual',
                'severity' => 'critical',
                'rule_config' => ['keywords' => ['teamvie', 'anydes', 'remote']],
            ],
            [
                'name' => 'Gojek Ride App',
                'type' => 'visual',
                'severity' => 'low',
                'rule_config' => ['keywords' => ['gojek']],
            ],
            [
                'name' => 'GPS Location App',
                'type' => 'visual',
                'severity' => 'medium',
                'rule_config' => ['keywords' => ['gps', 'fake']],
            ],
            [
                'name' => 'Suspicious Keyword',
                'type' => 'log',
                'severity' => 'medium',
                'rule_config' => ['keywords' => ['password', 'credential']],
            ],
        ];

        foreach ($rules as $rule) {
            DetectionRule::firstOrCreate(
                ['name' => $rule['name']],
                array_merge($rule, ['status' => 'active'])
            );
        }
    }
}
