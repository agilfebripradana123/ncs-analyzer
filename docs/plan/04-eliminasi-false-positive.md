# Plan 04 — Eliminasi False Positive & Dedup Temuan

Tanggal: 2026-09-25
Status: DONE (47 tests pass, build OK)

## Tujuan
Hentikan banjir temuan duplikat + false positive dari similarity matcher. OCR fragment 1 kata ("YouTube", "Super", "BS", "14.24") lolos threshold 0.35 dan tercatat ulang tiap frame (~5 detik).

## Masalah
1. **False positive single-term:** query 1 token vs corpus yang mengandung kata itu → cosine >0.35. Contoh: "YouTube" → 0.482 match "Ahirnya notif YouTube waras ✯𝗠𝗮𝗻𝘂𝘁𝟴𝟴✯".
2. **Duplikat per frame:** tiap OCR region dalam 1 frame bikin finding sendiri (2–3 finding/frame).
3. **Duplikat lintas frame:** matched_corpus sama tercatat ulang tiap frame, tanpa window dedup.
4. **Duplikat keyword:** "Cuan" match keyword rule tiap frame → finding baru tiap frame.
5. **Label menyesatkan:** `detection.confidence` (OCR confidence agent, 0.97) tampil sebagai "Similarity: 97%" di keyword finding.

## Keputusan
- **Anti-noise:** similarity require query ≥2 term + overlap ≥2 term dengan corpus. Fragment 1 kata = noise, bukan bukti.
- **Dedup per frame:** simpan 1 similarity dengan skor tertinggi.
- **Dedup temporal 60s:** skip keyword finding kalau (rule + analyzed_text) sama; skip similarity finding kalau matched_corpus sama untuk assessment yang sama.
- **Label jujur:** "Similarity" hanya untuk `matcher: similarity`. Keyword finding tidak tampilkan persen.
- **Evidence:** frame + log finding simpan `analyzed_text` dan `matched_corpus`.

## Implementasi

### File ubah
1. `app/Services/JudiSimilarityService.php` — konstanta `MIN_QUERY_TERMS=2`, `MIN_OVERLAP_TERMS=2`; return null kalau tidak terpenuhi
2. `app/Jobs/ProcessFrameDetections.php` — kumpulkan `$best` per frame (1 finding); helper `recentFinding()` (keyword dedup) + `recentCorpusFinding()` (similarity dedup 60s); keyword finding simpan `analyzed_text`
3. `app/Services/ActivityParserService.php` — log finding simpan `analyzed_text`
4. `frontend/src/components/FindingCard.jsx` — blok "Teks dianalisis" + "Cocok dengan"; `conf` hanya dibaca kalau `matcher === 'similarity'`

### File baru (test)
5. `tests/Feature/VisualFindingDedupTest.php` — 4 test: dedup per frame, analyzed_text, dedup lintas frame similarity 60s, dedup keyword 60s
6. `tests/Unit/JudiSimilarityServiceTest.php` — tambah 2 test: single common word + single shared-term overlap batal match

### Cleanup data
7. 385 finding similarity lama = semua single-term noise → dihapus dari DB. Keyword findings untouched.

## Verifikasi
- TDD: red phase confirm 3 finding/frame + `analyzed_text` missing, lalu green
- `php artisan test` 47 pass, `vite build` OK
