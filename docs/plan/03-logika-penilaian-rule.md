# Plan 03 — Logika Penilaian Rule Deteksi

Tanggal: 2026-09-25
Status: DRAFT

## Tujuan
Dokumentasi alur penilaian (scoring) dari deteksi → finding → risk score. Menjelaskan perbedaan visual vs log, cara kerja keyword vs similarity, dan bagaimana skor akhir dihitung.

## Sumber Data

Ada 2 jalur data masuk:

### 1. Visual (OCR Layar)
- **Sumber:** `capture-agent/agent.py` kirim frame → OCR → detection `{type: "ocr_text", label, text, confidence}`
- **Job:** `ProcessFrameDetections`
- **Output:** `VisualFinding`

### 2. Log (Aktivitas Browsing/App)
- **Sumber:** `capture-agent/agent.py` kirim activity entries `{type: "web"|"application"|"file", url, title, ...}`
- **Job:** `ProcessActivityLog` → `ActivityParserService`
- **Output:** `LogFinding` + `ActivityLog`

## Alur Pencocokan Rule

Kedua jalur pakai pola sama: **keyword dulu → similarity fallback**.

```
Detection masuk
  │
  ├─ Loop semua rule aktif (sesuai tipe: visual/log)
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

| Nama | Tipe | Matcher | Keparahan | Keterangan |
|------|------|---------|-----------|------------|
| Remote Access App | visual | keyword | critical | teamvie, anydes, remote |
| GPS Location App | visual | keyword | medium | gps, fake |
| Suspicious Keyword | log | keyword | medium | password, credential |
| Judi Online | visual | keyword | high | 51 keyword judi |
| Judi Online (Similarity) | visual | similarity | high | TF-IDF fallback, threshold 0.35 |
| Judi Online (Log) | log | similarity | high | TF-IDF fallback untuk URL/title |

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
- 1x Judi Online similarity (high) → bobot 7
- 1x Remote Access App (critical) → bobot 15
- 1x Suspicious Keyword log (medium) → bobot 3

```
visual_weight = 7 + 7 + 15 = 29
log_weight = 3
total = 32 → level: critical
```

Detail disimpan di `calculation_data` JSON:
```json
{
  "visual_weight": 29,
  "log_weight": 3,
  "visual_details": [
    {"rule": "Judi Online", "severity": "high", "weight": 7},
    {"rule": "Judi Online (Similarity)", "severity": "high", "weight": 7},
    {"rule": "Remote Access App", "severity": "critical", "weight": 15}
  ],
  "log_details": [
    {"rule": "Suspicious Keyword", "severity": "medium", "weight": 3}
  ]
}
```

## Flow Lengkap Assessment

```
1. Assessor buat Assessment (input: Nama, Instansi, Keterangan)
2. Agent register → consent → session aktif
3. Agent kirim frames + activity logs via WebSocket/HTTP
4. Frame → FrameEvidence → dispatch ProcessFrameDetections job
   Log → dispatch ProcessActivityLog job
5. Jobs jalankan pencocokan rule (keyword → similarity fallback)
6. Findings tersimpan (VisualFinding / LogFinding)
7. Setelah session selesai / on-demand: RiskScoreService hitung skor
8. Report di-generate dari assessment + findings + risk score
```

## Catatan Implementasi

- `firstOrCreate` dipakai untuk rule similarity agar tidak error kalau seeder belum jalan. Seeder pakai `updateOrCreate` supaya keyword update propagate.
- Similarity cache statis di `JudiSimilarityService::$cache` — hidup selama proses/job berjalan. Tidak persist antar request.
- Kolom `pattern` dan `risk_weight` sudah dihapus dari frontend Rules karena tidak ada di model/migration.
- `destroy` di `DetectionRuleController` soft-delete (set status=inactive), bukan hard delete, karena FK constraint ke findings.
