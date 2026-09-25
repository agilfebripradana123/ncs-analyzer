<?php

namespace Database\Seeders;

use App\Models\JudiCorpus;
use Illuminate\Database\Seeder;

class JudiDatasetSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/judi.csv');

        if (!file_exists($path)) {
            $this->command->warn("judi.csv not found at {$path}, skipping.");
            return;
        }

        $handle = fopen($path, 'r');
        $header = fgetcsv($handle);

        $labelIdx = array_search('label', $header);
        $commentIdx = array_search('comment', $header);

        $inserted = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $label = $row[$labelIdx] ?? null;
            $comment = trim($row[$commentIdx] ?? '');

            if (!in_array($label, ['0', '1'], true) || $comment === '') {
                $skipped++;
                continue;
            }

            JudiCorpus::updateOrCreate(
                ['text' => $comment, 'label' => (bool) $label],
                []
            );
            $inserted++;
        }

        fclose($handle);
        $this->command->info("judi corpus: {$inserted} inserted, {$skipped} skipped.");
    }
}
