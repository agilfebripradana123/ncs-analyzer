# Plan 06 — Eliminasi False Positive Layer 2 (YouTube) & Keterangan Match

Tanggal: 2026-09-26
Status: DONE (49 tests pass, build OK)

## Latar Belakang
Reparse assessment 17 menghasilkan 182 finding, mayoritas false positive dari entri YouTube (Layer 2). Dua akar masalah:

1. **Similarity:** judul YouTube berbagi kata umum BI dengan corpus judi (`mau`, `main`, `kalah`, `belajar`, `suka`, `untuk`, `dari`, `the`, `best`) → cosine > 0.35. Contoh real: `"KETIKA CHAINSAW MAN BELAJAR UNTUK LOMPAT TINGGI"` → 0.539 match `"WIBU69JP memberikan kesempatan untuk belajar dan berkembang"` (overlap: `belajar`, `untuk`). URL strip (Plan 05) tidak cukup — sisa teks judul tetap overlap.
2. **Keyword:** `matches()` memeriksa full JSON dump entry. Kata umum dalam judul (`bonus`, `daftar`, `login`, `paus`, `saldo`) atau substring acak match keyword → `"Matched rule: Judi Online"` tanpa penjelasan mana keyword yang kena.

## Keputusan

### A. Stopword similarity
- `STOPWORDS` const di `JudiSimilarityService`: kata fungsi BI+EN dan kata umum yang sering overlap (pronoun, preposisi, konjungsi, `main/menang/kalah/belajar/nonton/suka`, dll). Di-strip dari query DAN corpus sebelum TF-IDF.
- Kata judi spesifik (`agustoto`, `gacor`, `jackpot`, `maxwin`, `slot`, `zeus`) TIDAK masuk stopword — tetap jadi sinyal.
- Judul YouTube setelah strip sisa 0–1 token → gagal `MIN_QUERY_TERMS=2` → tidak jadi finding.

### B. Distinctive term gate
- Overlap harus mengandung ≥1 term dengan `df <= ceil(n_rows * 0.02)` (muncul di ≤2% baris corpus). Kata generik yang lolos stopword tetap tidak boleh trigger sendirian.
- `rareThreshold()` dihitung per corpus; `df` dihitung di `corpusVectors()` dan di-cache.

### C. Scope haystack keyword
- **Log (`ActivityParserService`):** hanya `title + url` (bukan `json_encode($entry)`). Loop keyword rule skip bila `rule_config.matcher !== 'keyword'`.
- **Visual (`ProcessFrameDetections`):** hanya `label + type + text` (bukan full JSON detection yang berisi confidence, bbox, dll).

### D. Keterangan match
- `matchedKeywords(rule, haystack)` method baru — return array keyword/domains yang match, bukan bool.
- Description: `"Matched rule: Judi Online (keyword: 'slot', 'gacor')"` (log) / `"Detected: Judi Online (keyword: 'slot')"` (visual).
- Evidence simpan `matched_keywords`.
- `matches()` lama tetap ada (delegasi `matchedKeywords() !== []`) — backward compatible untuk `RiskScoreServiceTest`.
- `FindingCard` tampilkan baris `"Kata kunci terdeteksi: 'slot', 'gacor'"` hanya untuk keyword findings (bukan similarity).

## Implementasi

### File ubah
1. `backend/app/Services/JudiSimilarityService.php` — `STOPWORDS` const (+filter di `tokenize`), `df` di `corpusVectors()`, `rareThreshold()`, gate distinctive term di `match()`
2. `backend/app/Services/ActivityParserService.php` — `matchedKeywords()` + description/evidence keyword; haystack `title+url`
3. `backend/app/Jobs/ProcessFrameDetections.php` — `matchedKeywords()` (ganti `matches()`), scoped `label/type/text`, description/evidence keyword
4. `frontend/src/components/FindingCard.jsx` — tampilkan `matched_keywords`

### File baru (test)
5. `backend/tests/Unit/JudiSimilarityServiceTest.php` — `test_youtube_watch_titles_do_not_match` (6 judul YouTube asli yang FP 0.35–0.54 → semua null)

## Verifikasi
- 6 judul YouTube yang sebelumnya match (score 0.352–0.539) → semua `null`
- `php artisan test` 49 pass (141 assertions)
- `npm run build` OK