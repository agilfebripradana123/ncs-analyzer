<?php

namespace App\Jobs;

use App\Models\Assessment;
use App\Services\ActivityParserService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessActivityLog implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Assessment $assessment,
        public array $entries,
    ) {}

    public function handle(ActivityParserService $parser): void
    {
        $parser->parse($this->assessment->id, $this->entries);
    }
}
