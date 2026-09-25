<?php

namespace Tests\Unit;

use App\Models\JudiCorpus;
use App\Services\JudiSimilarityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JudiSimilarityServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_normalize_handles_obfuscated_unicode(): void
    {
        $this->assertSame('wibu69jp memberikan pelayanan terbaik sepanjang masa!', mb_strtolower(JudiSimilarityService::normalize('𝙒𝙄𝘽𝙐69𝙅𝙋 Memberikan Pelayanan Terbaik Sepanjang Masa!')));
        $this->assertSame('agustoto', mb_strtolower(JudiSimilarityService::normalize('𝘼G𝘶𝘚𝘛О𝙏О')));
    }

    public function test_obfuscated_judi_comment_over_threshold(): void
    {
        $this->seed(\Database\Seeders\JudiDatasetSeeder::class);
        $matcher = JudiSimilarityService::fromConfig();
        $result = $matcher->match('AGUSTOT modal tipis doang gua langsung untung gede');
        $this->assertNotNull($result);
        $this->assertGreaterThanOrEqual(0.35, $result['score']);
    }

    public function test_non_judi_comment_below_threshold(): void
    {
        $this->seed(\Database\Seeders\JudiDatasetSeeder::class);
        $matcher = JudiSimilarityService::fromConfig();
        $this->assertNull($matcher->match('harga elpiji 3 kg naik lagi, rakyat susah'));
    }

    public function test_single_common_word_does_not_match(): void
    {
        JudiCorpus::create(['text' => 'Ahirnya notif YouTube waras Manut88', 'label' => true]);
        JudiCorpus::create(['text' => 'Pelayanan AERO88 super ramah', 'label' => true]);
        $matcher = new JudiSimilarityService(0.35);

        // OCR region bocoran 1 kata umum ("YouTube", "Super") bukan bukti judi
        $this->assertNull($matcher->match('YouTube'));
        $this->assertNull($matcher->match('Super'));
        $this->assertNull($matcher->match('BS'));
        $this->assertNull($matcher->match('14.24'));
    }

    public function test_single_shared_term_overlap_does_not_match(): void
    {
        JudiCorpus::create(['text' => 'slot online gacor agustoto', 'label' => true]);
        $matcher = new JudiSimilarityService(0.35);

        // Hanya 1 term yang sama ("slot") dengan corpus — kebetulan, bukan bukti
        $this->assertNull($matcher->match('slot'));
    }
}