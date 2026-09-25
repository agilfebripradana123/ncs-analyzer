<?php

namespace Tests\Feature;

use App\Jobs\ProcessFrameDetections;
use App\Models\Assessment;
use App\Models\AssessmentSession;
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
        DetectionRule::updateOrCreate(
            ['name' => 'Judi Online'],
            ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'keyword', 'keywords' => ['slot']]]
        );
        DetectionRule::firstOrCreate(
            ['name' => 'Judi Online (Similarity)'],
            ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'similarity', 'threshold' => 0.35]]
        );
    }

    private function makeFrame(Assessment $assessment, int $number): FrameEvidence
    {
        $session = AssessmentSession::factory()->create(['assessment_id' => $assessment->id]);
        return FrameEvidence::create([
            'assessment_id' => $assessment->id,
            'session_id' => $session->id,
            'device_id' => 'test-device',
            'frame_number' => $number,
            'captured_at' => now(),
        ]);
    }

    public function test_similarity_dedup_per_frame_keeps_highest_score_only(): void
    {
        $this->seed(\Database\Seeders\JudiDatasetSeeder::class);
        $this->setupRules();
        $assessment = Assessment::factory()->create(['status' => 'active']);
        $frame = $this->makeFrame($assessment, 1);

        // 3 OCR regions, none containing literal keyword "slot"
        $detections = [
            ['text' => 'AGUSTOT modal tipis doang gua langsung untung gede', 'label' => 'text', 'type' => 'ocr'],
            ['text' => 'wibu69jp memberikan pelayanan terbaik sepanjang masa', 'label' => 'text', 'type' => 'ocr'],
            ['text' => 'daftar situs judi online resmi terpercaya', 'label' => 'text', 'type' => 'ocr'],
        ];

        ProcessFrameDetections::dispatchSync($assessment, $detections, $frame->id);

        $findings = VisualFinding::where('assessment_id', $assessment->id)
            ->where('type', 'Judi Online (Similarity)')
            ->get();

        // 1 frame => 1 best similarity finding, regardless of OCR region count
        $this->assertSame(1, $findings->count());
    }

    public function test_evidence_contains_analyzed_text(): void
    {
        $this->seed(\Database\Seeders\JudiDatasetSeeder::class);
        $this->setupRules();
        $assessment = Assessment::factory()->create(['status' => 'active']);
        $frame = $this->makeFrame($assessment, 1);

        ProcessFrameDetections::dispatchSync($assessment, [
            ['text' => 'AGUSTOT modal tipis doang gua langsung untung gede', 'label' => 'text', 'type' => 'ocr'],
        ], $frame->id);

        $finding = VisualFinding::where('assessment_id', $assessment->id)->first();
        $this->assertNotEmpty($finding->evidence['analyzed_text']);
        $this->assertSame('AGUSTOT modal tipis doang gua langsung untung gede', $finding->evidence['analyzed_text']);
        $this->assertNotEmpty($finding->evidence['matched_corpus']);
    }

    public function test_similarity_dedup_same_corpus_across_frames_within_60s(): void
    {
        $this->seed(\Database\Seeders\JudiDatasetSeeder::class);
        $this->setupRules();
        $assessment = Assessment::factory()->create(['status' => 'active']);
        $frame1 = $this->makeFrame($assessment, 1);
        $frame2 = $this->makeFrame($assessment, 2);

        $detections = [
            ['text' => 'AGUSTOT modal tipis doang gua langsung untung gede', 'label' => 'text', 'type' => 'ocr'],
        ];

        ProcessFrameDetections::dispatchSync($assessment, $detections, $frame1->id);
        ProcessFrameDetections::dispatchSync($assessment, $detections, $frame2->id);

        $findings = VisualFinding::where('assessment_id', $assessment->id)
            ->where('type', 'Judi Online (Similarity)')
            ->count();

        // Same matched_corpus within 60s => dedup, only first frame kept
        $this->assertSame(1, $findings);
    }

    public function test_keyword_dedup_same_text_within_60s(): void
    {
        // Keyword rule with 'cuan' to simulate the reported false-positive pattern
        DetectionRule::updateOrCreate(
            ['name' => 'Judi Online'],
            ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'keyword', 'keywords' => ['cuan']]]
        );
        DetectionRule::firstOrCreate(
            ['name' => 'Judi Online (Similarity)'],
            ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'similarity', 'threshold' => 0.35]]
        );

        $assessment = Assessment::factory()->create(['status' => 'active']);
        $frame1 = $this->makeFrame($assessment, 1);
        $frame2 = $this->makeFrame($assessment, 2);

        ProcessFrameDetections::dispatchSync($assessment, [
            ['text' => 'cuan gampang', 'label' => 'text', 'type' => 'ocr'],
        ], $frame1->id);
        ProcessFrameDetections::dispatchSync($assessment, [
            ['text' => 'cuan gampang', 'label' => 'text', 'type' => 'ocr'],
        ], $frame2->id);

        $findings = VisualFinding::where('assessment_id', $assessment->id)
            ->where('type', 'Judi Online')
            ->count();

        // Same analyzed_text within 60s => 1 finding, no duplicate
        $this->assertSame(1, $findings);
    }
}