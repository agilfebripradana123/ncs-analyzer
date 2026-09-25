<?php

namespace App\Services;

use App\Models\JudiCorpus;

/**
 * TF-IDF + cosine similarity against judi corpus (zero dependency).
 * Keyword matcher is fast; this handles OCR text that misses literal keywords.
 */
class JudiSimilarityService
{
    private const MIN_TERM_LENGTH = 2;
    // Single-token OCR regions ("YouTube", "Super", "BS") share one common
    // term with a corpus row and easily clear 0.35. Require at least 2
    // distinct terms so a hit needs real phrase overlap, not one lucky word.
    private const MIN_QUERY_TERMS = 2;
    private const MIN_OVERLAP_TERMS = 2;

    private static ?array $cache = null;

    public function __construct(private float $threshold = 0.35) {}

    public static function fromConfig(): self
    {
        return new self((float) (config('services.judi.threshold', 0.35)));
    }

    /** @return array{score: float, matched: string}|null */
    public function match(string $text): ?array
    {
        $corpus = $this->corpusVectors();
        if ($corpus['texts'] === []) {
            return null;
        }

        $query = $this->queryVector($text, $corpus['idf']);
        if (count($query) < self::MIN_QUERY_TERMS) {
            return null; // single-fragment OCR regions are noise, not evidence
        }

        $best = null;
        $bestScore = 0.0;
        foreach ($corpus['vectors'] as $i => $vector) {
            $overlap = count(array_intersect_key($query, $vector));
            if ($overlap < self::MIN_OVERLAP_TERMS) {
                continue;
            }
            $score = self::cosine($query, $vector);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $i;
            }
        }

        if ($best === null || $bestScore < $this->threshold) {
            return null;
        }

        return ['score' => round($bestScore, 4), 'matched' => $corpus['texts'][$best]];
    }

    /** @return array{vectors: array<int,array<string,float>>, texts: array<int,string>, idf: array<string,float>} */
    private function corpusVectors(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }

        $rows = JudiCorpus::where('label', true)->pluck('text')->values()->all();

        $tokenized = array_map(fn (string $t) => self::tokenize($t), $rows);
        $tokenized = array_values(array_filter($tokenized, fn (array $t) => $t !== []));
        $rowsFiltered = [];
        foreach ($rows as $i => $r) {
            if (self::tokenize($r) !== []) {
                $rowsFiltered[] = $r;
            }
        }

        $n = count($tokenized);
        if ($n === 0) {
            return self::$cache = ['vectors' => [], 'texts' => [], 'idf' => []];
        }

        $df = [];
        foreach ($tokenized as $tokens) {
            foreach (array_unique($tokens) as $term) {
                $df[$term] = ($df[$term] ?? 0) + 1;
            }
        }
        $idf = [];
        foreach ($df as $term => $count) {
            $idf[$term] = log($n / (1 + $count)) + 1;
        }

        $vectors = [];
        foreach ($tokenized as $tokens) {
            $tf = array_count_values($tokens);
            $vec = [];
            foreach ($tf as $term => $c) {
                $vec[$term] = $c * ($idf[$term] ?? 0);
            }
            $vectors[] = $vec;
        }

        return self::$cache = ['vectors' => $vectors, 'texts' => $rowsFiltered, 'idf' => $idf];
    }

    /** @return array<string,float> */
    private function queryVector(string $text, array $idf): array
    {
        $tokens = self::tokenize($text);
        if ($tokens === []) {
            return [];
        }
        $tf = array_count_values($tokens);
        $vec = [];
        foreach ($tf as $term => $c) {
            $vec[$term] = $c * ($idf[$term] ?? 1);
        }
        return $vec;
    }

    /** @param array<string,float> $a @param array<string,float> $b */
    private static function cosine(array $a, array $b): float
    {
        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;
        foreach ($a as $term => $v) {
            $dot += $v * ($b[$term] ?? 0);
            $normA += $v * $v;
        }
        foreach ($b as $v) {
            $normB += $v * $v;
        }
        if ($normA <= 0 || $normB <= 0) {
            return 0.0;
        }
        return $dot / (sqrt($normA) * sqrt($normB));
    }

    /** @return array<string> */
    private static function tokenize(string $text): array
    {
        $text = self::normalize($text);
        if ($text === '') {
            return [];
        }
        $parts = preg_split('/[^\p{L}\p{N}]+/u', $text) ?: [];
        return array_values(array_filter(
            array_map('mb_strtolower', $parts),
            fn (string $t) => mb_strlen($t) >= self::MIN_TERM_LENGTH
        ));
    }

    public static function normalize(string $text): string
    {
        $text = \Normalizer::normalize($text, \Normalizer::FORM_KD) ?: $text;
        $text = strtr($text, [
            'А' => 'A', 'В' => 'B', 'Е' => 'E', 'К' => 'K', 'М' => 'M', 'Н' => 'H',
            'О' => 'O', 'Р' => 'P', 'С' => 'C', 'Т' => 'T', 'У' => 'Y', 'Х' => 'X',
            'а' => 'a', 'в' => 'b', 'е' => 'e', 'к' => 'k', 'м' => 'm', 'н' => 'h',
            'о' => 'o', 'р' => 'p', 'с' => 'c', 'т' => 't', 'у' => 'y', 'х' => 'x',
            'і' => 'i', 'І' => 'I',
        ]);
        $text = preg_replace('/\p{M}+/u', '', $text) ?: $text;
        return trim($text);
    }
}
