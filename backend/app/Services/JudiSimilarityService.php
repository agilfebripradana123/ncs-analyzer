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

    // Bahasa Indonesia + English function words / generic verbs that appear
    // in innocent text (YouTube titles, everyday chat) AND in judi corpus
    // ("mau", "main", "kalah", "belajar"). Stripping them from both sides
    // stops cosine overlap; distinctive judi terms (agustoto, gacor, jackpot)
    // survive and still match.
    private const STOPWORDS = [
        'yang' => 1, 'di' => 1, 'ke' => 1, 'dari' => 1, 'dan' => 1, 'atau' => 1,
        'itu' => 1, 'ini' => 1, 'dengan' => 1, 'akan' => 1, 'tidak' => 1,
        'bukan' => 1, 'ada' => 1, 'adalah' => 1, 'untuk' => 1, 'pada' => 1,
        'saya' => 1, 'kamu' => 1, 'aku' => 1, 'dia' => 1, 'kami' => 1, 'kita' => 1,
        'mereka' => 1, 'anda' => 1, 'kau' => 1, 'kalau' => 1, 'jika' => 1,
        'saat' => 1, 'agar' => 1, 'supaya' => 1, 'tapi' => 1, 'tetapi' => 1,
        'namun' => 1, 'karena' => 1, 'sudah' => 1, 'udah' => 1, 'belum' => 1,
        'bisa' => 1, 'dapat' => 1, 'harus' => 1, 'mau' => 1, 'ingin' => 1,
        'juga' => 1, 'hanya' => 1, 'lebih' => 1, 'sangat' => 1, 'terus' => 1,
        'lagi' => 1, 'saja' => 1, 'pun' => 1, 'kalian' => 1, 'gua' => 1, 'gw' => 1,
        'lo' => 1, 'lu' => 1, 'sih' => 1, 'deh' => 1, 'yah' => 1, 'ya' => 1,
        'eh' => 1, 'nah' => 1, 'suka' => 1, 'nonton' => 1, 'menonton' => 1,
        'menyukai' => 1, 'tonton' => 1, 'lihat' => 1, 'melihat' => 1, 'sama' => 1,
        'main' => 1, 'kalah' => 1, 'menang' => 1, 'belajar' => 1,
        'motor' => 1, 'ga' => 1, 'gak' => 1, 'nggak' => 1, 'orang' => 1, 'lain' => 1,
        'desa' => 1, 'jembatan' => 1, 'tolong' => 1, 'habib' => 1,
        'the' => 1, 'and' => 1, 'of' => 1, 'to' => 1, 'in' => 1, 'on' => 1,
        'at' => 1, 'is' => 1, 'are' => 1, 'was' => 1, 'were' => 1, 'be' => 1,
        'been' => 1, 'a' => 1, 'an' => 1, 'i' => 1, 'you' => 1, 'he' => 1,
        'she' => 1, 'it' => 1, 'we' => 1, 'they' => 1, 'my' => 1, 'your' => 1,
        'our' => 1, 'their' => 1, 'me' => 1, 'him' => 1, 'her' => 1, 'us' => 1,
        'them' => 1, 'for' => 1, 'with' => 1, 'as' => 1, 'by' => 1, 'from' => 1,
        'this' => 1, 'that' => 1, 'these' => 1, 'those' => 1, 'not' => 1,
        'no' => 1, 'but' => 1, 'or' => 1, 'so' => 1, 'if' => 1, 'then' => 1,
        'best' => 1, 'great' => 1, 'good' => 1, 'more' => 1, 'most' => 1,
        'video' => 1, 'youtube' => 1, 'shorts' => 1, 'short' => 1,
        'watch' => 1, 'subscribe' => 1,
    ];

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
            $overlap = array_intersect_key($query, $vector);
            if (count($overlap) < self::MIN_OVERLAP_TERMS) {
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

        // Overlap must come from distinctive terms: at least one shared term
        // must be rare (in <= 2% of corpus rows). "motor"/"belajar" style
        // generic words appear across rows and must not trigger alone.
        $overlapTerms = array_intersect_key($query, $corpus['vectors'][$best]);
        $rare = false;
        foreach (array_keys($overlapTerms) as $term) {
            if (($corpus['df'][$term] ?? PHP_INT_MAX) <= $this->rareThreshold($corpus)) {
                $rare = true;
                break;
            }
        }
        if (!$rare) {
            return null;
        }

        return ['score' => round($bestScore, 4), 'matched' => $corpus['texts'][$best]];
    }

    /** Max document frequency for a term to count as distinctive. */
    private function rareThreshold(array $corpus): int
    {
        return max(1, (int) ceil(count($corpus['texts']) * 0.02));
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
            return self::$cache = ['vectors' => [], 'texts' => [], 'idf' => [], 'df' => []];
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

        return self::$cache = ['vectors' => $vectors, 'texts' => $rowsFiltered, 'idf' => $idf, 'df' => $df];
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
        // Strip URLs entirely: youtube watch links etc. contribute only
        // boilerplate tokens ("www", "com") that overlap any corpus row
        // with a domain. Real judi domains arrive via keyword matcher,
        // or as their own words in text after the URL is removed.
        $text = preg_replace('#\b(?:https?://|www\.)\S+#iu', ' ', $text) ?: $text;
        $parts = preg_split('/[^\p{L}\p{N}]+/u', $text) ?: [];
        return array_values(array_filter(
            array_map('mb_strtolower', $parts),
            fn (string $t) => mb_strlen($t) >= self::MIN_TERM_LENGTH && !isset(self::STOPWORDS[$t])
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
