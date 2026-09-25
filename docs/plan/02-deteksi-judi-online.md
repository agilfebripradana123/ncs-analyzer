# Plan 02 — Deteksi Judi Online (Keyword + TF-IDF Similarity)

Tanggal: 2026-09-25
Status: DONE

## Tujuan
Deteksi aktivitas judi online dari OCR text layar HP. Hybrid: keyword match cepat → TF-IDF cosine similarity fallback pakai dataset `judi.csv` (899 baris, label 1 = judi).

## Keputusan
- **Threshold:** 0.35 — default di `.env` `JUDI_SIMILARITY_THRESHOLD`, bisa di-override per-rule via `rule_config.threshold` (dibaca dari rule aktif di DB saat job jalan)
- **Normalisasi:** NFKD Unicode + Cyrillic homoglyph map + lowercase
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
5. `app/Jobs/ProcessFrameDetections.php` — ambil rule similarity aktif dari DB, threshold dari `rule_config.threshold` (fallback 0.35), keyword loop dulu → similarity fallback untuk yang tidak ter-match kata kunci mana pun
6. `app/Services/ActivityParserService.php` — sama: similarity rule dibaca dari DB (`rule_config->matcher = similarity`), threshold per-rule

## Verifikasi
- Unit test similarity service
- `php artisan migrate` + `db:seed --class=JudiDatasetSeeder`
- `php artisan test` all pass
