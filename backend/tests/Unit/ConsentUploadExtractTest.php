<?php

namespace Tests\Unit;

use App\Http\Controllers\ConsentController;
use Tests\TestCase;
use ZipArchive;

class ConsentUploadExtractTest extends TestCase
{
    public function test_extract_merges_json_inside_zip(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'act').'.zip';
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('Takeout/a.json', json_encode([['type' => 'a'], ['type' => 'b']]));
        $zip->addFromString('Takeout/b.json', json_encode([['type' => 'c']]));
        $zip->addFromString('readme.txt', 'ignore');
        $zip->close();

        $ctrl = new ConsentController;
        $m = new \ReflectionMethod($ctrl, 'extractFromZip');
        $result = $m->invoke($ctrl, $path);
        @unlink($path);

        $this->assertCount(3, $result);
    }

    public function test_extract_returns_null_for_non_zip(): void
    {
        $ctrl = new ConsentController;
        $m = new \ReflectionMethod($ctrl, 'extractFromZip');
        $this->assertNull($m->invoke($ctrl, __FILE__));
    }
}
