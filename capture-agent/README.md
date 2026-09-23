# NCS Analyzer - Capture Agent

## Tujuan
Capture Agent adalah Proof of Concept (PoC) yang mendeteksi perangkat Android via ADB,
mengambil screenshot/frame layar Android secara berkala, memproses frame **in-memory**,
dan mengirim frame ke Laravel API **hanya ketika FrameProcessor menghasilkan deteksi**.

Arsitektur saat ini:
Android Employee → USB → ADB → Capture Agent → Frame in-memory → FrameProcessor → (deteksi? → send_frame ke Laravel)

Tahap ini: capture + agent integration + OCR processor (abstraction).
OCR engine dapat diganti; default `none` (tanpa deteksi, frame tidak dikirim). LLM & risk scoring
belum diimplementasikan.

## Requirement
- Python 3.8+
- Android device dengan USB debugging aktif
- ADB tersedia di PATH (`adb devices` harus list device)
- (Optional) Tesseract OCR — install: `apt install tesseract-ocr tesseract-ocr-ind` (Linux) atau download dari [GitHub](https://github.com/tesseract-ocr/tesseract)
- scrcpy opsional (untuk monitoring/debugging)
- Laravel backend jalan (`php artisan serve`)

## Setup backend (sekali)
```bash
cd backend
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## Cara memastikan ADB tersedia
```bash
adb version
adb devices
```
Harus tampil device dengan status `device`.

## Setup agent config
```bash
cd capture-agent
copy .env.example .env
```
Isi `.env` dengan nilai dari endpoint `POST /assessor/assessments/{assessment_id}/agent/token`
(lihat langkah E2E di bawah untuk alur lengkapnya):
```
NCS_API_URL=http://127.0.0.1:8000/api
NCS_SESSION_ID=<session_id dari response issueToken>
NCS_API_TOKEN=<agent_token dari response issueToken>
NCS_CAPTURE_INTERVAL=1.0
NCS_HEARTBEAT_INTERVAL=30.0
```

## Cara menjalankan agent
```bash
cd capture-agent
python agent.py
```
Tidak ada dependency eksternal (`requirements.txt` kosong).

Alur agent:
1. Baca `.env` (tidak menimpa env var yang sudah ada)
2. Deteksi ADB + device Android
3. Register agent ke session (`device_id` dari ADB)
4. Loop: heartbeat tiap interval, capture frame via `screencap` ke memory
5. Frame diproses `FrameProcessor` in-memory — hasil default `[]`, jadi frame **tidak** dikirim
6. Subclass `FrameProcessor.on_frame` mengembalikan daftar deteksi → `send_frame()` dipanggil otomatis

## Cara menghentikan agent
Tekan `Ctrl+C`. Agent cetak total frame diproses lalu exit clean.

## Test
```bash
cd capture-agent
python -m unittest test_agent -v
```

## Contoh output
```
=================================
 NCS Analyzer - Capture Agent
=================================

Checking ADB...
✓ ADB detected: C:\platform-tools\adb.exe

Checking Android device...
✓ Device detected: XXXXXXXX

Registering agent to session 3...
✓ Agent registered: Agent terdaftar

Starting capture (interval=1.0s) in-memory...
(Tekan Ctrl+C untuk menghentikan agent.)

[11:45:01] Frame processed in-memory (102400 bytes)
[11:45:02] Frame processed in-memory (102400 bytes)
[11:45:31] ♥ Heartbeat sent
```

## Batasan PoC
- Read-only / capture-only. Tidak mengontrol device.
- Frame hanya dikirim ke API ketika processor menghasilkan deteksi (OCR/visual detection = fase berikutnya).
- Raw PNG tidak di-upload; payload hanya metadata + detections.