<?php
use Illuminate\Contracts\Console\Kernel;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$a = App\Models\Assessment::select('id', 'title', 'assessment_code', 'status')->orderBy('id')->get();
foreach ($a as $r) {
    echo $r->id . ' | ' . $r->title . ' | ' . $r->assessment_code . ' | ' . $r->status . PHP_EOL;
}