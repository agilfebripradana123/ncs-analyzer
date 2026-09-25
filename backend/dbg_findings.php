<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = App\Models\VisualFinding::latest()->take(15)->get();
foreach ($rows as $f) {
    $ev = $f->evidence ?? [];
    printf("%d | %s | %s | frame=%s sim=%s | %s\n",
        $f->id, $f->type,
        substr($f->description, 0, 60),
        $ev['frame_evidence_id'] ?? '-',
        isset($ev['confidence']) ? round((float)$ev['confidence'], 3) : '-',
        substr($f->detected_at, 0, 19)
    );
}