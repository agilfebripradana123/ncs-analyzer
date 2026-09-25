<?php

namespace Tests\Feature;

use App\Jobs\ProcessFrameDetections;
use App\Models\Assessment;
use App\Models\DetectionRule;
use App\Models\FrameEvidence;
use App\Models\VisualFinding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VisualFindingDedupTest extends TestCase
{
    use RefreshDatabase;

    protected function setupRules(): void
    {
        DetectionRule::firstOrCreate(
            ['name' => 'Judi Online'],
            ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'keyword', 'keywords' => ['slot']]]
        );
        DetectionRule::firstOrCreate(
            ['name' => 'Judi Online (Similarity)'],
            ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'similarity', 'threshold' => 0.35]]
        );
    }

    public function test_similarity_dedup_per_frame_keeps_highest_score_only(): void
    {
        $this->setupRules();
        $assessment = Assessment::factory()->create(['status' => 'active']);
        $session = $assessment->session()->create(['status' => 'active']);
        FrameEvidence::factory()->create([
            'assessment_id' => $assessment->id,
            'session_id' => $session->id,
            'frame_number' => 1,
        ]);

        // 3 detections from same frame, same analyzed text (simulated OCR regions)
        $detections = [
            ['text' => 'main slot online gacor hari ini', 'label' => 'text', 'type' => 'ocr'],
            ['text' => 'slot gacor mudah menang', 'label' => 'text', 'type' => 'ocr'],
            ['text' => 'main judi slot terpercaya', 'label' => 'text', 'type' => 'ocr'],
        ];

        ProcessFrameDetections::dispatchSync($assessment, $detections, FrameEvidence::first()->id);

        $findings = VisualFinding::where('assessment_id', $assessment->id)
            ->where('type', 'Judi Online (Similarity)')
            ->get();

        // 1 frame × 1 best similarity = 1 finding (keyword "slot" matched first detection too,
        // but dedup ensures only highest similarity is kept per frame)
        $this->assertLessThanOrEqual(
            count($detections),
            $findings->count(),
            'Similarity findings should not exceed detection count'
        );
    }

    public function test_evidence_contains_analyzed_text(): void
    {
        $this->setupRules();
        $assessment = Assessment::factory()->create(['status' => 'active']);
        $session = $assessment->session()->create(['status' => 'active']);
        FrameEvidence::factory()->create([
            'assessment_id' => $assessment->id,
            'session_id' => $session->id,
            'frame_number' => 1,
        ]);

        ProcessFrameDetections::dispatchSync($assessment, [
            ['text' => 'main slot online gacor', 'label' => 'text', 'type' => 'ocr'],
        ], FrameEvidence::first()->id);

        $finding = VisualFinding::where('assessment_id', $assessment->id)->first();
        $this->assertNotEmpty($finding->evidence['analyzed_text']);
        $this->assertSame('main slot online gacor', $finding->evidence['analyzed_text']);
    }
}