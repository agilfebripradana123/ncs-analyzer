<?php

namespace App\Jobs;

use App\Models\AuditLog;
use App\Models\FrameEvidence;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class WipeRawData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $threshold = now()->subDays(30);

        $deletedFrames = FrameEvidence::where('created_at', '<', $threshold)->delete();
        $deletedLogs = DB::table('activity_logs')->where('created_at', '<', $threshold)->delete();

        AuditLog::create([
            'action' => 'wipe_raw_data',
            'description' => "Deleted {$deletedFrames} frame_evidence and {$deletedLogs} activity_logs older than 30 days",
            'entity_type' => 'system',
            'entity_id' => 0,
        ]);
    }
}
