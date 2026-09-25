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
                'name' => 'Remote Access App',
                'type' => 'visual',
                'severity' => 'critical',
                'rule_config' => ['keywords' => ['teamvie', 'anydes', 'remote']],
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
            [
                'name' => 'Judi Online',
                'type' => 'visual',
                'severity' => 'high',
                'rule_config' => ['keywords' => ['slot', 'gacor', 'maxwin', 'scatter', 'togel', 'toto', 'deposit', 'wd', 'rtp', 'chip', 'saldo', 'link alternatif', 'pola gacor', 'jam gacor', 'pragmatic', 'olympus', 'bonanza', 'zeus', 'joker', 'habanero', 'spaceman', 'starlight princess', 'new member', 'bonus', 'jackpot', 'pg soft', 'live casino', 'baccarat', 'blackjack', 'sweet bonanza', 'gates of olympus', 'starlight', 'wild west', 'mahjong ways', 'fortune', 'sugar rush', 'x500', 'x1000', 'free spin', 'bocoran', 'paus', 'sultan', 'cuan', 'mantap', 'daftar', 'login', 'withdraw', 'cashback', 'turnover', 'minimal bet', 'modal kecil', 'untung besar', 'anti rungkad', 'main santuy', 'receh']],
            ],
            [
                'name' => 'Judi Online (Similarity)',
                'type' => 'visual',
                'severity' => 'high',
                'rule_config' => ['matcher' => 'similarity', 'threshold' => 0.35, 'source' => 'database/data/judi.csv'],
            ],
            [
                'name' => 'Judi Online (Log)',
                'type' => 'log',
                'severity' => 'high',
                'rule_config' => ['matcher' => 'similarity', 'threshold' => 0.35, 'source' => 'database/data/judi.csv'],
            ],
        ];

        foreach ($rules as $rule) {
            DetectionRule::updateOrCreate(
                ['name' => $rule['name']],
                array_merge($rule, ['status' => 'active'])
            );
        }
    }
}
