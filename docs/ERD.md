# ERD — NCS Analyzer

> Database schema documentation. Update saat ada perubahan tabel.

---

## 1. users

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| name | string | |
| email | string | unique |
| password | string (hashed) | |
| role | enum | `admin`, `assessor` |
| status | enum | `active`, `inactive` |
| timestamps | | |

**Relasi:**
- `User` → `Assessment` (hasMany, assessor_id)
- `User` → `AuditLog` (hasMany)

---

## 2. employees

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| employee_code | string | unique |
| name | string | |
| department | string, nullable | |
| position | string, nullable | |
| status | enum | `active`, `inactive` |
| timestamps | | |

**Relasi:**
- `Employee` → `Assessment` (hasMany)

Employee tidak punya akun login. Diakses via assessment.

---

## 3. assessments

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| employee_id | bigUnsigned | **FK → employees.id**, cascadeOnDelete |
| assessor_id | bigUnsigned | **FK → users.id**, restrictOnDelete |
| title | string | |
| status | enum | `pending`, `consent`, `active`, `processing`, `completed`, `cancelled`, `expired` |
| started_at | timestamp, nullable | |
| completed_at | timestamp, nullable | |
| timestamps | | |

**Relasi:**
- `Assessment` → `Employee` (belongsTo)
- `Assessment` → `User` (belongsTo, assessor_id)
- `Assessment` → `Consent` (hasOne)
- `Assessment` → `AssessmentSession` (hasOne)
- `Assessment` → `ActivityLog` (hasMany)
- `Assessment` → `VisualFinding` (hasMany)
- `Assessment` → `LogFinding` (hasMany)
- `Assessment` → `RiskScore` (hasOne)
- `Assessment` → `Report` (hasOne)

Status flow: `pending` → `consent` → `active` → `processing` → `completed`
Alternative: `pending` → `cancelled` | `pending` → `expired` | `active` → `cancelled`

---

## 4. consents

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| assessment_id | bigUnsigned | **FK → assessments.id**, cascadeOnDelete |
| status | enum | `accepted`, `rejected` |
| consent_text | text | snapshot teks persetujuan saat approve |
| consented_at | timestamp, nullable | |
| ip_address | string(45), nullable | IPv6-safe |
| timestamps | | |

**Relasi:**
- `Consent` → `Assessment` (belongsTo)

Kolom `consent_text` dipertahankan supaya jika teks persetujuan berubah di masa depan, tetap tahu teks apa yang disetujui saat itu.

---

## 5. assessment_sessions

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| assessment_id | bigUnsigned | **FK → assessments.id**, cascadeOnDelete |
| session_token | string | unique |
| status | enum | `pending`, `active`, `disconnected`, `completed`, `expired` |
| started_at | timestamp, nullable | |
| expires_at | timestamp, nullable | |
| ended_at | timestamp, nullable | |
| timestamps | | |

**Relasi:**
- `AssessmentSession` → `Assessment` (belongsTo)

Status flow: `pending` → `active` → `completed`
Alternative: `active` → `disconnected` (resume) | `disconnected` → `expired` (idle timeout) | `penging` → `expired` | `active` → `cancelled`

---

## 6. activity_logs

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| assessment_id | bigUnsigned | **FK → assessments.id**, cascadeOnDelete |
| activity_type | string | e.g. `web`, `application`, `file` |
| activity_data | json | data aktivitas mentah |
| occurred_at | timestamp, nullable | |
| timestamps | | |

**Relasi:**
- `ActivityLog` → `Assessment` (belongsTo)

```json
{
  "title": "Example Website",
  "url": "https://example.com",
  "timestamp": "2026-09-21T10:30:00"
}
```

---

## 7. detection_rules

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| name | string | |
| type | enum | `visual`, `log` |
| rule_config | json | keywords, domains, patterns |
| severity | enum | `low`, `medium`, `high`, `critical` |
| status | enum | `active`, `inactive` |
| timestamps | | |

**Relasi:**
- `DetectionRule` → `VisualFinding` (hasMany)
- `DetectionRule` → `LogFinding` (hasMany)

Contoh rule_config:

```json
{ "keywords": ["keyword1", "keyword2"] }
```

```json
{ "domains": ["example.com"] }
```

---

## 8. visual_findings

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| assessment_id | bigUnsigned | **FK → assessments.id**, cascadeOnDelete |
| rule_id | bigUnsigned | **FK → detection_rules.id**, restrictOnDelete |
| type | string | e.g. `application`, `url` |
| description | text, nullable | |
| evidence | json, nullable | OCR text / AI detection result |
| severity | enum | `low`, `medium`, `high`, `critical` |
| detected_at | timestamp, nullable | |
| timestamps | | |

**Relasi:**
- `VisualFinding` → `Assessment` (belongsTo)
- `VisualFinding` → `DetectionRule` (belongsTo)

---

## 9. log_findings

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| assessment_id | bigUnsigned | **FK → assessments.id**, cascadeOnDelete |
| rule_id | bigUnsigned | **FK → detection_rules.id**, restrictOnDelete |
| type | string | |
| description | text, nullable | |
| evidence | json, nullable | matched activity data |
| severity | enum | `low`, `medium`, `high`, `critical` |
| detected_at | timestamp, nullable | |
| timestamps | | |

**Relasi:**
- `LogFinding` → `Assessment` (belongsTo)
- `LogFinding` → `DetectionRule` (belongsTo)

---

## 10. risk_scores

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| assessment_id | bigUnsigned | **FK → assessments.id**, cascadeOnDelete |
| score | decimal(8,2) | |
| level | enum | `low`, `medium`, `high`, `critical` |
| calculation_data | json, nullable | breakdown findings by severity |
| calculated_at | timestamp, nullable | |
| timestamps | | |

**Relasi:**
- `RiskScore` → `Assessment` (belongsTo)

---

## 11. reports

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| assessment_id | bigUnsigned | **FK → assessments.id**, cascadeOnDelete |
| summary | text, nullable | |
| total_findings | unsignedInteger | default 0 |
| generated_at | timestamp, nullable | |
| timestamps | | |

**Relasi:**
- `Report` → `Assessment` (belongsTo)

Tidak menyimpan risk_score / risk_level — baca dari `risk_scores` table.

---

## 12. audit_logs

| Kolom | Tipe | Constraint |
|---|---|---|
| id | bigIncrements | **PK** |
| user_id | bigUnsigned | **FK → users.id**, restrictOnDelete |
| action | string | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, dll |
| description | text, nullable | |
| entity_type | string, nullable | `assessment`, `employee`, `rule` |
| entity_id | unsignedBigInteger, nullable | |
| ip_address | string(45), nullable | |
| created_at | timestamp | **no updated_at** (immutable) |

**Relasi:**
- `AuditLog` → `User` (belongsTo)

---

## Diagram Relasi

```text
                         ┌──────────────┐
                         │    USERS     │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
             ┌──────────────┐       ┌──────────────┐
             │ ASSESSMENTS  │       │  AUDIT_LOGS  │
             └──────┬───────┘       └──────────────┘
                    │
       ┌────────────┼──────────────┐
       │            │              │
       ▼            ▼              ▼
  EMPLOYEES     CONSENT        SESSION
       │
       ├──────────────► ACTIVITY_LOGS
       │
       ├──────────────► VISUAL_FINDINGS ◄────┐
       │                                     │
       ├──────────────► LOG_FINDINGS ◄───────┤
       │                                     │
       ├──────────────► RISK_SCORE           │
       │                                     │
       └──────────────► REPORT               │
                                             │
                                      DETECTION_RULES
```

---

## Notes

- JSON columns: `activity_data`, `rule_config`, `evidence`, `calculation_data`
- Semua FK menggunakan `cascadeOnDelete` kecuali FK ke `users` (restrict) dan `detection_rules` (restrict) agar rule yang dipakai finding tidak terhapus tanpa konfirmasi
- `audit_logs` tidak punya `updated_at` — immutable log
- `reports` tidak menyimpan ulang `risk_score` / `risk_level` — read from `risk_scores`
