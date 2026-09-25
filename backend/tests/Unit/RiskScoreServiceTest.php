<?php

namespace Tests\Unit;

use App\Models\Assessment;
use App\Models\DetectionRule;
use App\Models\LogFinding;
use App\Models\VisualFinding;
use App\Services\ActivityParserService;
use App\Services\RiskScoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RiskScoreServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_risk_score_calculation_and_rule_matching(): void
    {
        $assessment = Assessment::factory()->create(['status' => 'active']);

        $visualRule = DetectionRule::create([
            'name' => 'Judi Online',
            'rule_config' => ['keywords' => ['slot', 'gacor']],
            'severity' => 'critical',
            'status' => 'active',
        ]);

        $logRule = DetectionRule::create([
            'name' => 'Judi Online (Similarity)',
            'rule_config' => ['matcher' => 'similarity'],
            'severity' => 'high',
            'status' => 'active',
        ]);

        VisualFinding::create([
            'assessment_id' => $assessment->id,
            'rule_id' => $visualRule->id,
            'type' => 'Judi Online',
            'description' => 'Detected slot',
            'evidence' => ['detection' => ['label' => 'slot']],
            'severity' => 'critical',
            'detected_at' => now(),
        ]);

        LogFinding::create([
            'assessment_id' => $assessment->id,
            'rule_id' => $logRule->id,
            'type' => 'Judi Online (Similarity)',
            'description' => 'Detected judi similarity',
            'evidence' => ['data' => ['url' => 'http://judi-site.com']],
            'severity' => 'high',
            'detected_at' => now(),
        ]);

        $service = new RiskScoreService();
        $score = $service->calculate($assessment->fresh());

        // critical=15 + high=7 = 22 → level "high"
        $this->assertEquals(22, (int) $score->score);
        $this->assertEquals('high', $score->level);
        $this->assertArrayHasKey('visual_weight', $score->calculation_data);
        $this->assertEquals(15, $score->calculation_data['visual_weight']);
        $this->assertEquals(7, $score->calculation_data['log_weight']);

        // Test rule matcher
        $parser = new ActivityParserService();
        $matchingEntry = ['type' => 'network', 'url' => 'http://game.com/slot-gacor'];
        $nonMatchingEntry = ['type' => 'network', 'url' => 'http://safe.com'];

        $this->assertTrue($parser->matches($visualRule, $matchingEntry));
        $this->assertFalse($parser->matches($visualRule, $nonMatchingEntry));

        // Test level thresholds
        $this->assertEquals('low', $service->level(3));
        $this->assertEquals('medium', $service->level(5));
        $this->assertEquals('high', $service->level(15));
        $this->assertEquals('critical', $service->level(30));
    }
}
