# Plan 02 — Deteksi Judi Online (Keyword + TF-IDF Similarity)

Tanggal: 2026-09-25
Status: DONE (47 tests pass, build OK)

## Tujuan
Deteksi aktivitas judi online dari OCR text layar HP. Hybrid: keyword match cepat → TF-IDF cosine similarity fallback pakai dataset `judi.csv` (899 baris, label 1 = judi).

## Keputusan
- **Threshold:** 0.35 — default di `.env` `JUDI_SIMILARITY_THRESHOLD`, bisa di-override per-rule via `rule_config.threshold` (dibaca dari rule aktif di DB saat job jalan)
- **Normalisasi:** NFKD Unicode + Cyrillic homoglyph map + lowercase
- **Anti-noise similarity:** query < 2 term atau overlap < 2 term dengan corpus → batal match (fragment OCR 1 kata seperti "YouTube", "Super", "BS" tidak jadi finding)
- **Dedup:** per frame simpan 1 similarity terbaik; lintas frame skip matched_corpus / analyzed_text sama dalam 60 detik
- **Integrasi:** langsung di `ProcessFrameDetections` (keyword dulu → similarity fallback)
- **Zero dependency:** PHP stdlib saja, tidak tambah package
- **Rules:** 2 rule aktif ("Judi Online" keyword 51 keywords, "Judi Online (Similarity)" threshold 0.35). Seeder pakai `firstOrCreate` — config edit admin tidak ditimpa saat seed ulang.

## Implementasi

### File baru
1. `database/migrations/xxxx_create_judi_corpus_table.php` — tabel `judi_corpus` (id, text, label)
2. `database/seeders/JudiDatasetSeeder.php` — import `database/data/judi.csv` via fgetcsv
3. `app/Services/JudiSimilarityService.php` — normalize → tokenize → TF-IDF → cosine → threshold

### File ubah
4. `database/seeders/DetectionRuleSeeder.php` — 2 rule aktif dengan `rule_config`:
   - `Judi Online` → `{ matcher: keyword, keywords: [51 kata] }`
   - `Judi Online (Similarity)` → `{ matcher: similarity, threshold: 0.35, source: database/data/judi.csv }`
5. `app/Jobs/ProcessFrameDetections.php` — ambil rule similarity aktif dari DB, threshold dari `rule_config.threshold` (fallback 0.35), keyword loop dulu → similarity fallback untuk yang tidak ter-match kata kunci mana pun. Dedup: per frame keep 1 skor terbaik; keyword & similarity skip jika `analyzed_text` / `matched_corpus` sama sudah ada dalam 60 detik
6. `app/Services/ActivityParserService.php` — sama: similarity rule dibaca dari DB (`rule_config->matcher = similarity`), threshold per-rule
7. `app/Services/JudiSimilarityService.php` — guard `MIN_QUERY_TERMS=2` + `MIN_OVERLAP_TERMS=2`; evidence frame/log simpan `analyzed_text` + `matched_corpus`
8. `frontend/src/components/FindingCard.jsx` — tampilkan "Teks dianalisis" + "Cocok dengan"; label "Similarity" hanya untuk `matcher: similarity` (bukan OCR confidence keyword finding)

## Verifikasi
- Unit test similarity service (termasuk anti-noise: `single common word does not match`, `single shared term overlap does not match`)
- Feature test dedup (`VisualFindingDedupTest`): per frame 1 similarity, keyword/similarity lintas frame 60s
- `php artisan migrate` + `db:seed --class=JudiDatasetSeeder`
- `php artisan test` 47 pass
