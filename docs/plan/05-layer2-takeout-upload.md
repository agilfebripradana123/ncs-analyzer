# Plan 05 — Layer 2: Google Takeout ZIP Upload

Tanggal: 2026-09-25
Status: DONE (48 test pass, build OK)

## Tujuan
Karyawan upload export Google My Activity (ZIP JSON-only via halaman consent) → parser → LogFinding + ActivityLog. Gantikan pendekatan Playwright/Agent Python (dibuang — 32-bit Python tidak bisa build greenlet).

## Layer 2 Schema

### Takeout keys → internal
| Takeout | Internal |
|---------|----------|
| `header/title/titleUrl/time/products` | `type/timestamp/title/url` |
| `activityData` (Gemini `safeHtmlItem.html`) | richest judi signal |
| `/Google Play Store/` | **skip** (app usage noise, irrelevant) |

### extractWebText logic
- `url` ← `entry.url ?? entry.titleUrl ?? entry.activity_data.url`
- `title` ← `entry.title ?? entry.activity_data.title`
- Gemini `safeHtmlItem.html` sebagai fallback title bila titleUrl ada

## File ubah
1. `backend/routes/api.php` — `POST /assessor/assessments/{id}/activities/reprocess`
2. `backend/app/Http/Controllers/ConsentController.php` — `extractFromZip` skip `/Google Play Store/`
3. `backend/app/Services/ActivityParserService.php` — `extractWebText` titleUrl fallback, `matches(string|array)` backward compatible
4. `backend/app/Jobs/ProcessActivityLog.php` — `dispatchSync`
5. `backend/app/Http/Controllers/Assessor/ActivityController.php` — `index` + `reprocess`
6. `frontend/src/pages/assessor/AssessmentDetail.jsx` — tabs: Konsen / Layer 1 / Layer 2 / Temuan / Sesi / Skor Risiko / Laporan
7. `frontend/src/components/FindingCard.jsx` — label "Similarity" hanya matcher similarity

## Tab Layout (AssessmentDetail)
- **Konsen** — status konsen + status sesi + QR 180px + link persetujuan (default)
- **Layer 1** — LiveScreen (kiri) + Temuan Layer 1 visualFindings (kanan), poll 3s
- **Layer 2** — Aktivitas Masuk (kiri) + Temuan Layer 2 logFindings (kanan) + Analisis Ulang button, poll 3s
- **Temuan** — gabungan semua findings (visual + log)
- Sesi / Skor Risiko / Laporan — tidak berubah

## Reparse Idempoten
`reparse()` hapus LogFinding dengan `activity_log_id` sebelum re-run → tidak ada duplikat.

## False Positive Fix (URL strip)
`JudiSimilarityService::tokenize()` strip URL (`https?://`, `www.`) sebelum tokenisasi. Mencegah overlap boilerplate `www`+`com` dengan corpus `www.sultanbet777.com`.
- 355 sultanbet777 false positive dihapus, reparse assessment 17 → 182 findings genuine
- Test baru `test_url_only_text_does_not_match`

## Verifikasi
- Upload Takeout ZIP JSON-only (135KB, 729 entries) → aktivitas muncul tab Layer 2
- Analisis Ulang → findings Layer 2 di Temuan
- `php artisan test` 48 pass
