# Plan 03 — Logika Penilaian Rule Deteksi

Tanggal: 2026-09-25
Status: DONE (41 tests pass, build OK)

## Tujuan
Dokumentasi alur penilaian (scoring) dari deteksi → finding → risk score. Menjelaskan perbedaan visual vs log, cara kerja keyword vs similarity, dan bagaimana skor akhir dihitung.

## Sumber Data

Ada 3 jalur data masuk:

### 1. Visual (OCR Layar)
- **Sumber:** `capture-agent/agent.py` kirim frame → OCR → detection `{type: "ocr_text", label, text, confidence}`
- **Job:** `ProcessFrameDetections`
- **Output:** `VisualFinding`

### 2. Log via Agent (Aktivitas Browsing/App Real-time)
- **Sumber:** `capture-agent/agent.py` kirim activity entries `{type: "web"|"application"|"file", url, title, ...}`
- **Job:** `ProcessActivityLog` → `ActivityParserService`
- **Output:** `LogFinding` + `ActivityLog`

### 3. Log via Upload JSON/ZIP (Layer 2 — Google My Activity)
- **Sumber:** Karyawan upload file `.json` atau `.zip` (export Google My Activity) di halaman consent setelah klik "Setuju & Lanjutkan"
- **Route:** `POST /consent/{token}/upload` (public, tanpa auth Sanctum — pakai consent token sebagai otorisasi)
- **Controller:** `ConsentController::upload` → `ConsentUploadRequest` (validasi mimes:json,zip max 100MB)
- **Extract:** Flat JSON langsung decode; ZIP dibuka pakai `ZipArchive` (stdlib PHP), scan semua file `.json` di dalam archive, merge entries
- **Job:** `ProcessActivityLog::dispatchSync` → `ActivityParserService`
- **Output:** `LogFinding` + `ActivityLog`
- **Alur lengkap:** QR → ConsentPage → Setuju → redirect `/consent/{token}/upload` → pilih file → unggah → hasil entries_count

## Alur Pencocokan Rule

Kedua jalur pakai pola sama: **keyword dulu → similarity fallback**.

```
Detection masuk
  │
  ├─ Loop semua rule aktif (universal, tanpa filter tipe)
  │    └─ Cek keywords di rule_config
  │         ├─ Match → buat Finding (matcher: "keyword")
  │         └─ Tidak match → lanjut rule berikutnya
  │
  └─ Jika TIDAK ADA keyword yang match:
       └─ Jalankan JudiSimilarityService (TF-IDF cosine)
            ├─ Score ≥ 0.35 → buat Finding (matcher: "similarity")
            └─ Score < 0.35 → abaikan, tidak ada finding
```

### Detail Keyword Match

**Visual (`ProcessFrameDetections::matches`):**
Cek `detection.label`, `detection.type`, `detection.text`, dan full JSON detection terhadap setiap keyword di `rule_config.keywords`. Pakai `str_contains` (substring match).

**Log (`ActivityParserService::matches`):**
JSON-encode seluruh entry → cek substring terhadap `rule_config.keywords` dan `rule_config.domains`.

### Detail Similarity Fallback

**Visual:** Teks dari `detection.text` atau `detection.label` → normalisasi NFKD + Cyrillic map → tokenize → TF-IDF vector → cosine similarity lawan corpus `judi_corpus` (899 baris dari `judi.csv`, hanya label=1). Threshold default 0.35.

**Log:** Hanya jalan untuk entry yang punya URL/title. `extractWebText()` gabungkan title + url → normalisasi → TF-IDF → cosine. Entry tanpa teks web (misal type=file tanpa url) di-skip.

## Daftar Rule Aktif

| Nama | Matcher | Keparahan | Keterangan |
|------|---------|-----------|------------|
| Judi Online | keyword | high | 51 keyword judi (visual + log) |
| Judi Online (Similarity) | similarity | high | TF-IDF fallback, threshold 0.35, corpus 899 baris |

> Semua rule universal — tidak dibedakan per tipe data (visual/log). Loop semua rule aktif untuk setiap entry.

## Perhitungan Risk Score

`RiskScoreService::calculate()` dipanggil setelah semua finding terkumpul.

### Bobot per Severity

| Severity | Bobot |
|----------|-------|
| low | 1 |
| medium | 3 |
| high | 7 |
| critical | 15 |

### Formula

```
visual_weight = Σ bobot(severity) dari semua VisualFinding
log_weight    = Σ bobot(severity) dari semua LogFinding
total_score   = visual_weight + log_weight
```

### Level

| Total Score | Level |
|-------------|-------|
| ≥ 30 | critical |
| ≥ 15 | high |
| ≥ 5 | medium |
| < 5 | low |

### Contoh Perhitungan

Assessment dengan temuan:
- 1x Judi Online keyword match (high) → bobot 7
- 1x Judi Online (Similarity) log (high) → bobot 7

```
visual_weight = 7
log_weight = 7
total = 14 → level: medium
```

Detail disimpan di `calculation_data` JSON:
```json
{
  "visual_weight": 7,
  "log_weight": 7,
  "visual_details": [
    {"rule": "Judi Online", "severity": "high", "weight": 7}
  ],
  "log_details": [
    {"rule": "Judi Online (Similarity)", "severity": "high", "weight": 7}
  ]
}
```

## Flow Lengkap Assessment

```
1. Assessor buat Assessment (input: Nama, Instansi, Keterangan)
2. Karyawan scan QR → buka ConsentPage di device mereka
3. Karyawan klik "Setuju & Lanjutkan" → redirect ke halaman Upload Data
4. Karyawan upload file .json atau .zip (export Google My Activity) → POST /consent/{token}/upload
5. Server extract entries (flat JSON atau scan ZIP) → ProcessActivityLog → ActivityParserService → LogFinding
6. Agent register → session aktif → kirim frames + activity logs real-time via HTTP
7. Frame → FrameEvidence → dispatch ProcessFrameDetections job
   Log agent → dispatch ProcessActivityLog job
8. Jobs jalankan pencocokan rule (keyword → similarity fallback)
9. Findings tersimpan (VisualFinding / LogFinding)
10. Setelah session selesai / on-demand: RiskScoreService hitung skor
11. Report di-generate dari assessment + findings + risk score
```

## Catatan Implementasi

- `firstOrCreate` dipakai untuk rule similarity agar tidak error kalau seeder belum jalan. Seeder pakai `firstOrCreate` supaya config edit admin tidak ditimpa saat seed ulang.
- Similarity cache statis di `JudiSimilarityService::$cache` — hidup selama proses/job berjalan. Tidak persist antar request.
- Kolom `pattern`, `risk_weight`, dan `type` sudah dihapus dari model/migration/frontend. Rule universal — matcher ditentukan `rule_config` (`keywords` vs `matcher: similarity`).
- Rule non-judi (Remote Access App, GPS Location App, Suspicious Keyword) sudah dihapus dari seeder + DB. Fokus deteksi: judi online.
- `destroy` di `DetectionRuleController` soft-delete (set status=inactive), bukan hard delete, karena FK constraint ke findings.
- Admin form Rules.jsx: field matcher (select keyword/similarity), keywords (textarea comma-separated), threshold (number input conditional similarity). Payload kirim `rule_config` object dengan `matcher` key.
- Threshold per-rule: `ProcessFrameDetections` dan `ActivityParserService` baca `rule_config.threshold` dari rule similarity aktif di DB, fallback 0.35.
- Audit log: middleware skip path `agent/heartbeat`, `agent/frames`, `agent/register`. Table `audit_logs` di-truncate.
- Upload consent: endpoint public (tanpa Sanctum), otorisasi via consent token + status check `consented`. ZIP extraction pakai `ZipArchive` stdlib, scan nested dirs untuk file `.json`.
