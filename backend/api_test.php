<?php
$base = 'http://127.0.0.1:8000/api';
$ch = curl_init("$base/login");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode(['email' => 'assessor@ncs-analyzer.test', 'password' => 'Assessor123!']),
  CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
]);
$res = curl_exec($ch);
echo "LOGIN: $res\n\n";
$login = json_decode($res, true);
$token = $login['token'] ?? ($login['data']['token'] ?? null);
if (!$token) {
  // login maybe returns plain data
  $token = $login['data']['access_token'] ?? null;
}
echo "TOKEN: ".($token ?? 'NULL')."\n\n";
if ($token) {
  $ch2 = curl_init("$base/assessor/assessments?page=1");
  curl_setopt_array($ch2, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json', "Authorization: Bearer $token"],
  ]);
  echo "ASSESSMENTS:\n".curl_exec($ch2)."\n";
}