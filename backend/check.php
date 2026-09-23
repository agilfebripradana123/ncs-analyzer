<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
echo "assessments: ".DB::table('assessments')->count()."\n";
foreach(DB::table('assessments')->orderBy('id','desc')->limit(5)->get() as $r){
  echo json_encode((array)$r, JSON_UNESCAPED_SLASHES)."\n";
}
echo "--- users ---\n";
foreach(DB::table('users')->select('id','name','email','role')->get() as $r){
  echo json_encode((array)$r, JSON_UNESCAPED_SLASHES)."\n";
}
