<?php

namespace App\Jobs;

use App\Models\Assessment;
use App\Models\DetectionRule;
use App\Models\VisualFinding;
use App\Services\JudiSimilarityService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessFrameDetections implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Assessment $assessment,
        public array $detections,
        public int $frameEvidenceId,
    ) {}

    public function handle(): void
    {
        $rules = DetectionRule::where('status', 'active')->get();
        $judiRule = null;
        $similarity = null;
        $best = null;

        $simRule = $rules->first(fn ($r) => ($r->rule_config['matcher'] ?? 'keyword') === 'similarity');
        if ($simRule !== null) {
            $similarity = new JudiSimilarityService((float) ($simRule->rule_config['threshold'] ?? 0.35));
        } else {
            $similarity = JudiSimilarityService::fromConfig();
        }

        foreach ($this->detections as $detection) {
            $matched = false;
            foreach ($rules as $rule) {
                if (($rule->rule_config['matcher'] ?? 'keyword') !== 'keyword') {
                    continue;
                }
                $hitKw = $this->matchedKeywords($rule, $detection);
                if ($hitKw !== []) {
                    $text = trim(mb_strtolower($detection['text'] ?? $detection['label'] ?? ''));
                    // temporal dedup: same rule + same analyzed text within 60s
                    if ($this->recentFinding($rule->id, $text)) {
                        $matched = true;
                        continue;
                    }
                    $reason = implode(', ', array_map(fn ($m) => "'$m'", array_slice($hitKw, 0, 5)));
                    VisualFinding::create([
                        'assessment_id' => $this->assessment->id,
                        'rule_id' => $rule->id,
                        'type' => $rule->name,
                        'description' => "Detected: {$rule->name} (keyword: {$reason})",
                        'evidence' => [
                            'frame_evidence_id' => $this->frameEvidenceId,
                            'detection' => $detection,
                            'analyzed_text' => $detection['text'] ?? $detection['label'] ?? '',
                            'matcher' => 'keyword',
                            'matched_keywords' => $hitKw,
                        ],
                        'severity' => $rule->severity,
                        'detected_at' => now(),
                    ]);
                    $matched = true;
                }
            }

            if (!$matched && $similarity !== null) {
                $text = $detection['text'] ?? $detection['label'] ?? '';
                if ($text !== '' && $text !== null) {
                    $result = $similarity->match($text);
                    // ponytail: dedup per frame, keep best score only. Upgrade to
                    // temporal window (e.g. skip same matched_corpus within 60s) later.
                    if ($result !== null && ($best === null || $result['score'] > $best['score'])) {
                        $best = [
                            'score' => $result['score'],
                            'matched' => $result['matched'],
                            'text' => $text,
                        ];
                    }
                }
            }
        }

        if ($best === null) {
            return;
        }

        $judiRule ??= DetectionRule::where('rule_config->matcher', 'similarity')
            ->where('status', 'active')->first()
            ?? DetectionRule::firstOrCreate(
                ['name' => 'Judi Online (Similarity)'],
                ['severity' => 'high', 'status' => 'active', 'rule_config' => ['matcher' => 'similarity', 'threshold' => 0.35]]
            );

        $matchedCorpus = mb_substr($best['matched'], 0, 200);

        // temporal dedup: skip same corpus match within 60s
        if ($this->recentCorpusFinding($judiRule->id, $matchedCorpus)) {
            return;
        }

        VisualFinding::create([
            'assessment_id' => $this->assessment->id,
            'rule_id' => $judiRule->id,
            'type' => 'Judi Online (Similarity)',
            'description' => "Detected: Judi Online (similarity: " . round($best['score'], 3) . ")",
            'evidence' => [
                'frame_evidence_id' => $this->frameEvidenceId,
                'analyzed_text' => $best['text'],
                'matcher' => 'similarity',
                'confidence' => $best['score'],
                'matched_corpus' => $matchedCorpus,
            ],
            'severity' => $judiRule->severity,
            'detected_at' => now(),
        ]);
    }

    /** @return list<string> matched keywords, empty = no match */
    private function matchedKeywords(DetectionRule $rule, array $detection): array
    {
        $config = $rule->rule_config ?? [];
        // Only match against OCR label/type/text — not full JSON dump which
        // includes confidence scores, bounding boxes etc. causing false substring hits.
        $label = strtolower($detection['label'] ?? '');
        $type = strtolower($detection['type'] ?? '');
        $text = strtolower($detection['text'] ?? '');
        $searchable = $label . ' ' . $type . ' ' . $text;
        $hits = [];

        foreach (($config['keywords'] ?? []) as $kw) {
            $lk = strtolower($kw);
            if (str_contains($searchable, $lk)) {
                $hits[] = $kw;
                if (count($hits) >= 6) break;
            }
        }

        return $hits;
    }

    /** Skip if same rule + normalized analyzed_text already exists for this assessment within 60s. */
    private function recentFinding(int $ruleId, string $analyzedText): bool
    {
        return VisualFinding::where('assessment_id', $this->assessment->id)
            ->where('rule_id', $ruleId)
            ->where('detected_at', '>=', now()->subSeconds(60))
            ->get()
            ->contains(fn ($f) => mb_strtolower(trim($f->evidence['analyzed_text'] ?? '')) === $analyzedText);
    }

    /** Skip if same matched_corpus already exists for this assessment within 60s. */
    private function recentCorpusFinding(int $ruleId, string $matchedCorpus): bool
    {
        return VisualFinding::where('assessment_id', $this->assessment->id)
            ->where('rule_id', $ruleId)
            ->where('detected_at', '>=', now()->subSeconds(60))
            ->get()
            ->contains(fn ($f) => ($f->evidence['matched_corpus'] ?? null) === $matchedCorpus);
    }
}