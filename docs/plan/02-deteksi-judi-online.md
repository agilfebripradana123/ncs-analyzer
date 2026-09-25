# Plan 02 — Deteksi Judi Online (Keyword + TF-IDF Similarity)

Tanggal: 2026-09-25
Status: DONE

## Tujuan
Deteksi aktivitas judi online dari OCR text layar HP. Hybrid: keyword match cepat → TF-IDF cosine similarity fallback pakai dataset `judi.csv` (899 baris, label 1 = judi).

## Keputusan
- **Threshold:** 0.35 (config `.env` `JUDI_SIMILARITY_THRESHOLD`)
- **Normalisasi:** NFKD Unicode + Cyrillic homoglyph map + lowercase
- **Integrasi:** langsung di `ProcessFrameDetections` (keyword dulu → similarity fallback)
- **Zero dependency:** PHP stdlib saja, tidak tambah package

## Implementasi

### File baru
1. `database/migrations/xxxx_create_judi_corpus_table.php` — tabel `judi_corpus` (id, text, label)
2. `database/seeders/JudiDatasetSeeder.php` — import `database/data/judi.csv` via fgetcsv
3. `app/Services/JudiSimilarityService.php` — normalize → tokenize → TF-IDF → cosine → threshold

### File ubah
4. `database/seeders/DetectionRuleSeeder.php` — tambah rule visual "Judi Online" + keywords (slot, gacor, maxwin, scatter, togel, toto, deposit, wd, rtp, chip, saldo, link alternatif, pola gacor, jam gacor, pragmatic, olympus, bonanza, zeus, joker, habanero, spaceman, starlight princess, new member, bonus)
5. `app/Jobs/ProcessFrameDetections.php` — setelah keyword loop, unmatched detections → similarity service → jika ≥ threshold buat VisualFinding dengan evidence.matcher='similarity'

## Verifikasi
- Unit test similarity service
- `php artisan migrate` + `db:seed --class=JudiDatasetSeeder`
- `php artisan test` all pass
