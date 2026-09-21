# PRD — NCS Analyzer
> **National Cyber Security Assessment & Risk Analyzer**
> PT Dieng Cyber Indonesia

---

## 1. Informasi Produk

| Item | Detail |
|---|---|
| Product Name | NCS Analyzer |
| Product Type | Hybrid Security Assessment Platform |
| Organization | PT Dieng Cyber Indonesia |
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Laravel API |
| Database | MySQL |
| Queue | Laravel Queue + Redis |
| Realtime | Laravel Reverb / WebSocket |
| Storage | Laravel Storage |
| Processing | OCR / AI Detection Service |
| Primary Users | Admin, Asesor |
| Assessment Subject | Employee / Karyawan |

---

## 2. Product Overview

NCS Analyzer adalah platform untuk membantu proses asesmen keamanan karyawan menggunakan pendekatan **Hybrid Assessment** yang terdiri dari:

1. Visual Forensic
2. Data Forensic
3. Finding Analysis
4. Risk Score Calculation
5. Risk Profile Reporting
6. Data Security & Auto-Wipe

Sistem menggabungkan hasil analisis visual dan data aktivitas untuk menghasilkan profil risiko karyawan berdasarkan aturan dan metodologi asesmen yang telah ditentukan.

---

## 3. Problem Statement

Proses asesmen keamanan membutuhkan pengumpulan dan analisis data dari beberapa sumber.

Permasalahan yang ingin diselesaikan:

- Proses asesmen sulit dipantau secara terpusat.
- Data visual dan data aktivitas berasal dari sumber berbeda.
- Analisis manual membutuhkan waktu.
- Temuan sulit dikonsolidasikan.
- Perhitungan risiko membutuhkan proses yang konsisten.
- Data mentah perlu dikelola dengan mekanisme keamanan dan retensi.
- Hasil asesmen perlu disajikan dalam bentuk laporan yang terstruktur.

---

## 4. Product Goals

NCS Analyzer bertujuan untuk:

- Memusatkan proses asesmen dalam satu platform.
- Mengelola assessment dari awal sampai selesai.
- Menghubungkan karyawan dengan assessment menggunakan QR Code.
- Mendukung analisis visual melalui screen casting dan OCR/AI.
- Mendukung analisis data aktivitas melalui file JSON.
- Menghasilkan finding dari hasil analisis.
- Menggabungkan finding dari beberapa sumber.
- Menghitung Risk Score berdasarkan rule yang ditentukan.
- Menghasilkan Risk Profile dan Report.
- Mengelola data mentah berdasarkan kebijakan retensi.
- Menyediakan audit trail terhadap aktivitas sistem.

---

## 5. Non-Goals

Versi awal sistem tidak bertujuan untuk:

- Menjadi antivirus.
- Menjadi endpoint detection and response (EDR) penuh.
- Melakukan tindakan otomatis terhadap perangkat karyawan.
- Menghapus data perangkat karyawan secara langsung.
- Menggantikan analis keamanan manusia.
- Menentukan pelanggaran hanya berdasarkan satu temuan tanpa rule/metodologi yang ditetapkan.
- Menyimpan data mentah lebih lama dari kebutuhan kebijakan retensi.

---

## 6. User Roles

### 6.1 Admin

Admin adalah pengguna yang bertanggung jawab terhadap pengelolaan sistem.

**Hak akses:**

- Login
- Mengelola user
- Mengelola akun asesor
- Mengelola data employee
- Mengelola detection rules
- Mengelola risk configuration
- Melihat seluruh assessment
- Melihat audit log
- Melihat report
- Mengelola konfigurasi sistem

### 6.2 Asesor

Asesor adalah pengguna yang melakukan dan memantau proses assessment.

**Hak akses:**

- Login
- Melihat dashboard
- Membuat assessment
- Memilih employee
- Membuat session
- Generate QR Code
- Memantau assessment
- Melihat visual finding
- Melihat activity finding
- Melihat risk score
- Melihat report
- Mengakhiri assessment

Asesor tidak dapat mengubah konfigurasi sistem yang hanya diperuntukkan bagi Admin.

### 6.3 Employee

Employee adalah karyawan yang menjadi subjek assessment.

Employee tidak menjadi pengguna utama dashboard admin/asesor.

Aktivitas employee dalam assessment dapat meliputi:

- Membaca informasi assessment
- Memberikan informed consent
- Scan QR Code
- Mengikuti assessment session
- Menjalankan proses yang diperlukan dalam assessment

---

## 7. Core Concept

NCS Analyzer menggunakan pendekatan:

```text
EMPLOYEE
    |
    v
CONSENT
    |
    v
ASSESSMENT
    |
    v
ASSESSMENT SESSION
    |
    +-------------------------+
    |                         |
    v                         v
VISUAL FORENSIC          DATA FORENSIC
    |                         |
    v                         v
OCR / AI                 JSON / ACTIVITY
    |                         |
    v                         v
VISUAL FINDING           LOG FINDING
    |                         |
    +------------+------------+
                 |
                 v
         FINDING INTEGRATION
                 |
                 v
          RISK SCORE ENGINE
                 |
                 v
            RISK PROFILE
                 |
                 v
              REPORT
                 |
        +--------+--------+
        |                 |
        v                 v
 STOP SESSION        AUTO-WIPE
                     RAW DATA
```

---

## 8. Assessment Flow

### 8.1 Preparation

```text
START
  |
  v
Admin / Asesor Login
  |
  v
Select Employee
  |
  v
Create Assessment
```

### 8.2 Informed Consent

Employee mendapatkan informasi mengenai assessment.

```text
Assessment Created
        |
        v
Consent Required
        |
        v
Employee Reads Consent
        |
        v
Employee Approves
        |
        v
Consent Recorded
```

Consent harus memiliki:

- Consent version
- Timestamp
- Assessment ID
- Employee ID
- IP address jika diperlukan
- User agent jika diperlukan
- Digital signature/approval jika digunakan

### 8.3 Assessment Session

Setelah consent disetujui:

```text
Assessment
    |
    v
Create Session
    |
    v
Generate QR Code
    |
    v
Employee Scan QR
    |
    v
Validate Session Token
    |
    v
Session Active
```

Session memiliki status:

- `pending`
- `active`
- `processing`
- `disconnected`
- `completed`
- `cancelled`
- `expired`

---

## 9. Layer 1 — Visual Forensic

Visual Forensic digunakan untuk menganalisis informasi yang terlihat pada layar perangkat selama assessment sesuai ruang lingkup dan persetujuan assessment.

```text
Screen Casting
      |
      v
Screen Frame
      |
      +----------------+
      |                |
      v                v
     OCR          AI Detection
      |                |
      +-------+--------+
              |
              v
        Detection Result
              |
              v
         Detection Rules
              |
        +-----+-----+
        |           |
       YES          NO
        |           |
        v           v
   Create Finding  Ignore
```

---

## 10. Screen Casting

Screen Casting adalah proses menampilkan/mengirim tampilan layar perangkat employee ke sistem asesor selama session assessment.

**Tujuan:**

- Memungkinkan asesor melihat proses assessment.
- Menyediakan sumber visual untuk analisis.
- Mendukung proses OCR/AI detection.

Screen casting harus memiliki:

- Session ID
- Start time
- End time
- Connection status
- Device/session identifier
- Permission status

Screen casting dihentikan ketika assessment selesai atau session dihentikan.

### 10.1 Opsi Teknologi

Screen casting adalah **integration point** — teknologi konkret ditentukan setelah requirement teknis final. Opsi yang dipertimbangkan:

| Opsi | Mekanisme | Kelebihan | Kekurangan |
|---|---|---|---|
| A. WebRTC | Browser-to-server realtime | Latensi rendah, native browser, tanpa install | Kompleksitas signaling/STUN/TURN |
| B. Desktop Agent + WebSocket | Agent di perangkat employee, streaming ke server | Kontrol lebih besar, capture di luar browser | Wajib install agent, lebih berat |
| C. Third-party Screenshare API | Layanan eksternal | Cepat integrasi | Biaya, data melewati pihak ketiga |

**Persyaratan teknis (berlaku untuk opsi mana pun):**

- Latensi rendah (target < 500 ms).
- Frame capture tersedia untuk OCR/AI detection.
- Transmisi terenkripsi.
- Connection recovery / auto-reconnect.
- Monitoring bandwidth dan kualitas koneksi.
- Pemutusan otomatis saat session berakhir.

**Keputusan:** ditentukan pada tahap requirement finalization.

---

## 11. OCR

OCR (Optical Character Recognition) digunakan untuk membaca teks yang terdapat pada frame/tampilan layar.

```text
Screen Image
      |
      v
     OCR
      |
      v
Extracted Text
      |
      v
Rule Matching
      |
      v
Finding
```

OCR result dapat memiliki:

- Detected text
- Confidence
- Timestamp
- Session ID
- Source frame

---

## 12. AI Detection

AI Detection digunakan untuk mendeteksi objek, logo, aplikasi, atau elemen visual tertentu sesuai model yang digunakan.

Contoh output:

```json
{
    "type": "application",
    "value": "Example App",
    "confidence": 0.94
}
```

AI Detection harus menghasilkan confidence score untuk membantu menentukan validitas deteksi.

---

## 13. Layer 2 — Data Forensic

Data Forensic digunakan untuk menganalisis data aktivitas yang tersedia dalam format terstruktur, misalnya JSON.

```text
Activity Data
      |
      v
JSON Upload
      |
      v
Secure Storage
      |
      v
Queue
      |
      v
JSON Parser
      |
      v
Structured Activity
      |
      v
Detection Rules
      |
      v
Log Finding
```

---

## 14. JSON Processing

File JSON tidak diproses secara langsung di HTTP request apabila ukurannya besar.

```text
Upload JSON
     |
     v
Store File
     |
     v
Dispatch Job
     |
     v
ProcessActivityLog Job
     |
     v
Parse JSON
     |
     v
Save Activity Log
     |
     v
Run Detection Rules
```

---

## 15. Activity Log

Activity Log merupakan catatan aktivitas yang dianalisis oleh sistem.

Atribut:

- Timestamp
- Activity Type
- Title
- URL
- Source
- Metadata

Contoh:

```json
{
    "source": "activity_data",
    "activity_type": "web",
    "title": "Example Website",
    "url": "https://example.com",
    "visited_at": "2026-09-21T10:00:00"
}
```

---

## 16. Detection Rules

Detection Rule digunakan untuk menentukan apakah suatu data perlu menghasilkan finding.

Struktur dasar:

```text
Rule
├── Name
├── Type
├── Pattern
├── Severity
├── Risk Weight
└── Status
```

Contoh:

```text
IF domain matches rule
THEN create finding
```

Rule harus dapat dikelola oleh Admin.

---

## 17. Finding

Finding adalah hasil analisis yang dianggap relevan berdasarkan detection rule.

Jenis finding:

- Visual Finding
- Log Finding

Contoh:

```text
Finding
-------------------------
Source      : Visual
Type        : Application
Value       : Example App
Severity    : High
Confidence  : 94%
Timestamp   : 10:15:30
```

---

## 18. Finding Integration

Finding dari Visual Forensic dan Data Forensic digabungkan ke dalam satu assessment.

```text
Visual Finding
      |
      +----------------+
                       |
Log Finding ----------> Integration
                       |
                       v
                 Combined Findings
```

Sistem harus menghindari duplikasi finding jika dua sumber mendeteksi kejadian yang sama berdasarkan rule yang ditentukan.

---

## 19. Risk Score Engine

Risk Score Engine bertanggung jawab untuk menghitung nilai risiko berdasarkan finding.

**Input:**

- Visual Findings
- Log Findings
- Severity
- Risk Weight
- Assessment Rules

**Output:**

- Risk Score
- Risk Level

```text
Visual Score
      +
Log Score
      +
Rule Weight
      |
      v
Risk Score Engine
      |
      v
Final Risk Score
```

Rumus dan threshold Risk Score harus dapat dikonfigurasi berdasarkan metodologi resmi assessment.

Contoh kategori:

- LOW
- MEDIUM
- HIGH

Nilai threshold pada tahap implementasi harus ditentukan berdasarkan requirement final.

---

## 20. Risk Score

Risk Score adalah nilai hasil perhitungan dari seluruh finding yang relevan.

Contoh:

```text
Visual Score     : 30
Log Score        : 25
---------------------
Total Risk Score : 55
Risk Level       : MEDIUM
```

Nilai di atas hanya contoh dan bukan nilai final sistem.

---

## 21. Report

Setelah assessment selesai, sistem menghasilkan Risk Profile Report.

Isi report minimal:

- Employee Information
- Assessment Information
- Assessor Information
- Assessment Date
- Assessment Status
- Visual Findings
- Data Findings
- Risk Score
- Risk Level
- Finding Summary
- Risk Summary
- Assessment Timeline

Report dapat tersedia dalam:

- Dashboard
- PDF
- JSON jika diperlukan

---

## 22. Dashboard

### 22.1 Admin Dashboard

Dashboard Admin menampilkan:

- Total Employee
- Total Assessor
- Total Assessment
- Active Assessment
- Completed Assessment
- Risk Distribution
- Recent Assessment
- Detection Rules
- Audit Log

### 22.2 Assessor Dashboard

Dashboard Asesor menampilkan:

- Active Assessment
- Recent Assessment
- Assessment Status
- Employee
- Session Status
- Finding Count
- Risk Score
- Risk Level

---

## 23. Assessment Detail

Halaman detail assessment:

```text
Assessment Information
----------------------
Assessment ID
Employee
Assessor
Created At
Status

Session
----------------------
Session Status
Started At
Ended At

Visual Analysis
----------------------
Screen Casting Status
Visual Finding Count

Data Analysis
----------------------
Activity Count
Log Finding Count

Risk
----------------------
Risk Score
Risk Level

Report
----------------------
Generate Report
View Report
```

---

## 24. Database / ERD

Entity utama:

- `users`
- `employees`
- `assessments`
- `consents`
- `assessment_sessions`
- `activity_logs`
- `visual_findings`
- `log_findings`
- `detection_rules`
- `risk_scores`
- `reports`
- `audit_logs`

Relasi utama:

```text
User
  |
  +---- Assessor
  |
  +---- Admin

Employee
    |
    v
Assessment
    |
    +---- Consent
    |
    +---- Assessment Session
    |
    +---- Activity Logs
    |
    +---- Visual Findings
    |
    +---- Log Findings
    |
    +---- Risk Score
    |
    +---- Report
```

---

## 25. Database Tables

### users

| Column | Type |
|---|---|
| id | PK |
| name | string |
| email | string, unique |
| password | hashed |
| role | enum(`admin`, `assessor`) |
| status | boolean |
| created_at | timestamp |
| updated_at | timestamp |

### employees

| Column | Type |
|---|---|
| id | PK |
| employee_code | string, unique |
| name | string |
| department | string |
| position | string |
| status | boolean |
| created_at | timestamp |
| updated_at | timestamp |

### assessments

| Column | Type |
|---|---|
| id | PK |
| employee_id | FK |
| assessor_id | FK |
| assessment_code | string, unique |
| status | enum(`pending`, `consent`, `active`, `processing`, `completed`, `cancelled`, `expired`) |
| started_at | timestamp, nullable |
| completed_at | timestamp, nullable |
| created_at | timestamp |
| updated_at | timestamp |

### consents

| Column | Type |
|---|---|
| id | PK |
| assessment_id | FK |
| employee_id | FK |
| consent_version | string |
| consented_at | timestamp |
| ip_address | string, nullable |
| user_agent | string, nullable |
| signature | text, nullable |
| created_at | timestamp |
| updated_at | timestamp |

### assessment_sessions

| Column | Type |
|---|---|
| id | PK |
| assessment_id | FK |
| session_token | string, unique |
| qr_token | string, unique |
| device_identifier | string, nullable |
| status | enum(`pending`, `active`, `processing`, `disconnected`, `completed`, `cancelled`, `expired`) |
| started_at | timestamp, nullable |
| ended_at | timestamp, nullable |
| created_at | timestamp |
| updated_at | timestamp |

### activity_logs

| Column | Type |
|---|---|
| id | PK |
| assessment_id | FK |
| source | string |
| activity_type | string |
| title | string, nullable |
| url | string, nullable |
| visited_at | timestamp |
| metadata | json, nullable |
| created_at | timestamp |
| updated_at | timestamp |

### visual_findings

| Column | Type |
|---|---|
| id | PK |
| assessment_id | FK |
| session_id | FK, nullable |
| detected_type | string |
| detected_value | string |
| confidence | decimal |
| severity | enum(`low`, `medium`, `high`, `critical`) |
| detected_at | timestamp |
| metadata | json, nullable |
| created_at | timestamp |
| updated_at | timestamp |

### log_findings

| Column | Type |
|---|---|
| id | PK |
| assessment_id | FK |
| activity_log_id | FK, nullable |
| rule_id | FK |
| detected_value | string |
| severity | enum(`low`, `medium`, `high`, `critical`) |
| risk_weight | decimal |
| detected_at | timestamp |
| created_at | timestamp |
| updated_at | timestamp |

### detection_rules

| Column | Type |
|---|---|
| id | PK |
| name | string |
| type | enum(`visual`, `log`, `both`) |
| pattern | string |
| severity | enum(`low`, `medium`, `high`, `critical`) |
| risk_weight | decimal |
| is_active | boolean |
| created_at | timestamp |
| updated_at | timestamp |

### risk_scores

| Column | Type |
|---|---|
| id | PK |
| assessment_id | FK |
| visual_score | decimal |
| log_score | decimal |
| total_score | decimal |
| risk_level | enum(`low`, `medium`, `high`) |
| calculated_at | timestamp |
| created_at | timestamp |
| updated_at | timestamp |

### reports

| Column | Type |
|---|---|
| id | PK |
| assessment_id | FK |
| report_number | string, unique |
| report_path | string |
| generated_at | timestamp |
| created_at | timestamp |
| updated_at | timestamp |

### audit_logs

| Column | Type |
|---|---|
| id | PK |
| user_id | FK, nullable |
| action | string |
| entity_type | string |
| entity_id | string, nullable |
| ip_address | string, nullable |
| metadata | json, nullable |
| created_at | timestamp |

---

## 26. Backend Architecture

Laravel digunakan sebagai backend/API utama.

```text
React
   |
   | REST API
   v
Laravel
   |
   +-- Authentication
   +-- Authorization
   +-- Assessment
   +-- Session
   +-- Finding
   +-- Risk Engine
   +-- Report
   +-- Queue
   +-- Audit Log
   |
   +----------------+
                    |
                    v
                  MySQL
```

---

## 27. Laravel Structure

```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── EmployeeController.php
│   │   ├── AssessmentController.php
│   │   ├── ConsentController.php
│   │   ├── SessionController.php
│   │   ├── ActivityLogController.php
│   │   ├── FindingController.php
│   │   ├── RiskScoreController.php
│   │   └── ReportController.php
│   │
│   └── Requests/
│
├── Models/
│
├── Services/
│   ├── AssessmentService.php
│   ├── SessionService.php
│   ├── FindingService.php
│   ├── RiskScoreService.php
│   └── ReportService.php
│
├── Jobs/
│   ├── ProcessActivityLog.php
│   ├── ProcessVisualFinding.php
│   ├── CalculateRiskScore.php
│   └── WipeRawData.php
│
└── Policies/
```

---

## 28. Frontend Architecture

React digunakan sebagai frontend.

```text
src/
├── components/
├── pages/
│   ├── auth/
│   ├── admin/
│   ├── assessor/
│   ├── assessments/
│   └── reports/
│
├── layouts/
├── services/
│   └── api.js
│
├── hooks/
├── contexts/
├── utils/
└── App.jsx
```

---

## 29. Frontend Pages

```text
Authentication
/login

Admin
/admin/dashboard
/admin/users
/admin/employees
/admin/rules
/admin/assessments
/admin/audit-logs

Assessor
/assessor/dashboard
/assessor/assessments
/assessor/assessments/create
/assessor/assessments/:id
/assessor/assessments/:id/session
/assessor/reports
```

---

## 30. API Structure

Base URL:

```text
/api
```

**Authentication:**

```text
POST /api/login
POST /api/logout
GET  /api/me
```

**Employees:**

```text
GET    /api/employees
POST   /api/employees
GET    /api/employees/{id}
PUT    /api/employees/{id}
DELETE /api/employees/{id}
```

**Assessments:**

```text
GET    /api/assessments
POST   /api/assessments
GET    /api/assessments/{id}
PUT    /api/assessments/{id}
POST   /api/assessments/{id}/start
POST   /api/assessments/{id}/complete
```

**Consent:**

```text
POST /api/assessments/{id}/consent
GET  /api/assessments/{id}/consent
```

**Sessions:**

```text
POST /api/assessments/{id}/sessions
GET  /api/sessions/{token}
POST /api/sessions/{token}/connect
POST /api/sessions/{token}/disconnect
```

**Activity:**

```text
POST /api/assessments/{id}/activity/upload
GET  /api/assessments/{id}/activities
```

**Findings:**

```text
GET /api/assessments/{id}/findings
GET /api/assessments/{id}/visual-findings
GET /api/assessments/{id}/log-findings
```

**Risk:**

```text
GET  /api/assessments/{id}/risk-score
POST /api/assessments/{id}/risk-score/calculate
```

**Report:**

```text
POST /api/assessments/{id}/report
GET  /api/assessments/{id}/report
```

---

## 31. Authentication

Authentication menggunakan Laravel API authentication.

Recommended: **Laravel Sanctum**

```text
React
  |
  | Login
  v
Laravel
  |
  v
Authentication
  |
  v
Token / Session
  |
  v
React
```

Semua endpoint sensitif harus membutuhkan authentication.

---

## 32. Authorization

Authorization berdasarkan role dan permission.

```text
Admin
    |
    +-- Manage Users
    +-- Manage Employees
    +-- Manage Rules
    +-- View All Assessments
    +-- View Audit Logs

Assessor
    |
    +-- Create Assessment
    +-- Manage Own Assessment
    +-- View Findings
    +-- View Risk Score
    +-- Generate Report
```

Authorization harus diterapkan pada backend Laravel.

Frontend hanya digunakan untuk mengatur tampilan berdasarkan permission, bukan sebagai satu-satunya mekanisme keamanan.

---

## 33. Queue Architecture

Proses berat menggunakan Laravel Queue.

```text
JSON Upload
     |
     v
Laravel
     |
     v
Queue
     |
     +-- ProcessActivityLog
     |
     +-- ProcessVisualFinding
     |
     +-- CalculateRiskScore
     |
     +-- GenerateReport
     |
     +-- WipeRawData
```

Redis digunakan sebagai queue backend apabila diperlukan.

Semua job harus memiliki **retry policy** dan **failed job handling** (Laravel failed_jobs, notifikasi ke asesor/admin saat job gagal).

---

## 34. Realtime Architecture

Untuk status assessment dan monitoring realtime:

```text
React
   |
   v
Laravel
   |
   v
Event
   |
   v
Laravel Reverb / WebSocket
   |
   v
React
```

Contoh event:

- `AssessmentStarted`
- `SessionConnected`
- `VisualFindingDetected`
- `LogFindingCreated`
- `RiskScoreCalculated`
- `AssessmentCompleted`

---

## 35. Data Security

Sistem harus memperhatikan:

- Authentication
- Authorization
- HTTPS
- Input validation
- File validation
- Secure file storage
- Token expiration
- Session expiration
- Database access control
- Audit logging
- Raw data retention
- Auto-wipe
- Rate limiting
- Protection terhadap unauthorized access
- Enkripsi data sensitif saat disimpan (at-rest) dan saat transit (in-transit)

---

## 36. Raw Data Retention

Data mentah harus memiliki kebijakan retensi.

```text
Raw Data
   |
   v
Assessment Completed
   |
   v
Retention Period
   |
   v
Expired?
  /   \
Yes    No
 |      |
 v      v
Wipe   Keep
```

Data hasil assessment seperti:

- Finding
- Risk Score
- Report

harus dipisahkan dari raw data dan memiliki kebijakan penyimpanan tersendiri.

Raw data mencakup: file JSON activity, screen frame/recording, hasil OCR mentah, hasil AI detection mentah.

---

## 37. Audit Log

Sistem mencatat aktivitas penting seperti:

- Login
- Logout
- Create Assessment
- Update Assessment
- Delete Assessment
- View Report
- Create Rule
- Update Rule
- Delete Rule
- Start Session
- End Session
- Generate Report
- Wipe Raw Data

Audit log digunakan untuk mengetahui:

- WHO
- WHAT
- WHEN
- WHERE

---

## 38. Error Handling

API harus menggunakan HTTP status code yang sesuai.

Contoh:

- `200 OK`
- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `422 Validation Error`
- `429 Too Many Requests`
- `500 Internal Server Error`

Response API harus konsisten.

```json
{
    "success": false,
    "message": "Assessment not found",
    "data": null
}
```

---

## 39. Error Scenarios

Skenario kegagalan dan penanganannya:

| Skenario | Penanganan |
|---|---|
| JSON malformed | Job gagal → retry dengan backoff → notifikasi asesor setelah retry habis |
| OCR service down | Skip visual analysis sementara, catat warning di audit log, beri tahu asesor |
| AI detection timeout | Fallback ke rule-based saja untuk periode tersebut, tandai finding sebagai partial |
| Session disconnect | Auto-reconnect; jika gagal dalam 30 detik → status `disconnected`, asesor dapat resume |
| Risk calculation gagal | Assessment ditandai `processing` → admin/asesor dapat memicu ulang kalkulasi |
| Report generation gagal | Retry 3x bertingkat → jika tetap gagal, tandai untuk intervensi manual |
| Upload file tidak valid | Tolak dengan 422 + pesan spesifik (format/ukuran/konten) |
| Queue worker down | Job tetap di antrean, proses berlanjut setelah worker kembali |
| Duplikasi event realtime | Client harus idempotent terhadap event (dedupe by event ID) |

---

## 40. Ignored Section (cadangan)

> Bagian ini sengaja dikosongkan agar penomoran section berikutnya tetap stabil tanpa perlu renumber.

---

## 41. Technical Constraints

Nilai default, dapat dikonfigurasi sesuai kebutuhan deployment:

| Batasan | Nilai Default | Keterangan |
|---|---|---|
| Max size file JSON activity | 100 MB | Validasi saat upload; tolak di atas batas |
| Max ukuran file lain (frame/evidence) | 20 MB | Per file |
| Maksimum session per assessment | 1 session aktif | Sesuai flow consent → session |
| Session timeout | 4 jam | Sejak session `active`; otomatis `expired` |
| Session idle timeout | 30 menit | Tidak ada aktivitas → `disconnected`/`expired` |
| Maksimum concurrent assessment per asesor | 10 | Cegah overload kerja asesor |
| Raw data retention period | 30 hari | Sejak assessment `completed` |
| API rate limit | 100 req/menit per user | Strict per token, 429 saat terlampaui |
| Maksimum visual findings per session | 10.000 | Guard untuk mencegah flooding |
| Maksimum activity logs per assessment | 50.000 | Guard untuk batas pemrosesan |
| Token (Sanctum) expiration | 24 jam | Refresh dengan re-login |
| QR token expiration | 10 menit | Sejak generate; sekali pakai |
| Pagination API | 20 per halaman | Default; klien dapat meminta maks 100 |
| Realtime reconnect | 3x percobaan | Sebelum penandaan `disconnected` |

---

## 42. Data Privacy & Compliance

Sistem menangani data pribadi dan data sensitif karyawan. Harus memenuhi:

- Kepatuhan terhadap regulasi yang berlaku (misal GDPR, UU PDP Indonesia)
- **Mekanisme penarikan consent:** employee dapat menarik consent sebelum session dimulai; assessment dibatalkan
- **Right to be forgotten:** permintaan penghapusan data assessment (sesuai kebijakan retensi dan hukum)
- **Data export:** employee dapat meminta data assessment miliknya dalam format JSON
- **Anonymization:** data yang digunakan untuk pengembangan/training model harus dianonimisasi
- **Third-party processor:** OCR/AI vendor wajib memiliki perjanjian pemroses data (DPA)
- **Minimal data collection:** hanya data yang diperlukan untuk assessment yang dikumpulkan
- **Pembatasan akses:** data assessment hanya dapat diakses oleh asesor terkait dan admin
- **Logging akses data:** akses terhadap data mentah dicatat di audit log

---

## 43. UI/UX Requirements

Design dashboard harus:

- Modern
- Profesional
- Responsive
- Mudah dibaca
- Fokus pada data
- Menggunakan visual hierarchy yang jelas
- Menampilkan status dengan jelas
- Menampilkan Risk Score secara mudah dipahami
- Menyediakan feedback ketika proses berlangsung

Komponen utama:

- Sidebar
- Topbar
- Dashboard Card
- Data Table
- Status Badge
- Modal
- Form
- Chart
- Timeline
- Finding Card
- Risk Score Card
- Notification

---

## 44. Assessment Status

Status assessment:

- `PENDING`
- `CONSENT`
- `ACTIVE`
- `PROCESSING`
- `COMPLETED`
- `CANCELLED`
- `EXPIRED`

Flow:

```text
PENDING
   ↓
CONSENT
   ↓
ACTIVE
   ↓
PROCESSING
   ↓
COMPLETED
```

Alternative:

```text
PENDING → CANCELLED
PENDING → EXPIRED
ACTIVE  → CANCELLED
```

---

## 45. Session Status

Status session:

- `PENDING`
- `ACTIVE`
- `PROCESSING`
- `DISCONNECTED`
- `COMPLETED`
- `CANCELLED`
- `EXPIRED`

Flow utama:

```text
PENDING
   ↓
ACTIVE
   ↓
COMPLETED
```

Alternatif:

```text
ACTIVE      → DISCONNECTED → ACTIVE (resume)
PENDING     → EXPIRED
ACTIVE      → CANCELLED
DISCONNECTED → EXPIRED (idle timeout)
```

---

## 46. Functional Requirements

### FR-01 Authentication

System harus menyediakan login dan logout.

### FR-02 Role Management

System harus membedakan Admin dan Asesor.

### FR-03 Employee Management

Admin dapat mengelola data employee.

### FR-04 Assessment Management

Asesor dapat membuat dan mengelola assessment.

### FR-05 Consent

System harus mencatat informed consent.

### FR-06 QR Session

System harus dapat membuat QR untuk assessment session.

### FR-07 Session Management

System harus dapat membuat, mengaktifkan, dan mengakhiri session.

### FR-08 Screen Casting

System harus mendukung integrasi screen casting selama session.

### FR-09 OCR

System harus dapat menerima hasil OCR dari visual processing service.

### FR-10 AI Detection

System harus dapat menerima hasil AI detection.

### FR-11 Activity Data

System harus dapat menerima file activity data dalam format JSON.

### FR-12 JSON Processing

System harus dapat melakukan parsing terhadap JSON.

### FR-13 Detection Rule

Admin dapat membuat dan mengubah detection rule.

### FR-14 Finding

System harus dapat membuat finding berdasarkan rule.

### FR-15 Finding Integration

System harus menggabungkan finding dari visual dan data analysis.

### FR-16 Risk Score

System harus menghitung Risk Score.

### FR-17 Report

System harus dapat menghasilkan Risk Profile Report.

### FR-18 Audit Log

System harus mencatat aktivitas penting dalam sistem.

### FR-19 Raw Data Retention

System harus menerapkan kebijakan retensi data mentah.

### FR-20 Auto-Wipe

System harus dapat menghapus raw data secara otomatis ketika memenuhi kondisi retensi.

### FR-21 Consent Withdrawal (tambahan)

System harus mendukung penarikan consent oleh employee sebelum session dimulai.

### FR-22 Rate Limiting (tambahan)

System harus menerapkan rate limiting pada API.

---

## 47. Non-Functional Requirements

**Performance**

- Dashboard harus dapat memuat data secara efisien.
- Proses berat harus menggunakan Queue.
- API harus memiliki pagination untuk dataset besar.

**Security**

- Semua endpoint sensitif membutuhkan authentication.
- Authorization dilakukan di backend.
- File upload harus divalidasi.
- Session token harus memiliki expiration.
- Raw data harus memiliki kebijakan retensi.

**Scalability**

System harus memungkinkan penambahan:

- AI model
- OCR provider
- Detection rule
- Data source
- Risk calculation method
- Report format

tanpa mengubah keseluruhan arsitektur.

**Maintainability**

Code harus menggunakan:

- Service Layer
- Form Request
- Policy
- Job
- Event
- Repository jika diperlukan
- API Resource

---

## 48. Testing Strategy

| Jenis Test | Cakupan |
|---|---|
| Unit Test | Service, Risk Score Engine, Detection Rule matcher, JSON Parser |
| Integration Test | Seluruh endpoint API, queue job, storage |
| E2E Test | Alur assessment lengkap: create → consent → QR → session → finding → risk → report |
| Load Test | Concurrent assessment (asesor + session aktif), simulasi upload JSON besar |
| Security Test | OWASP Top 10, auth bypass, file upload exploit, rate limiting |
| Performance Test | Parsing JSON besar (100 MB), query dashboard dengan dataset besar |

**Kriteria minimum:** Risk Score Engine dan Detection Rules harus memiliki unit test dengan coverage > 80% sebelum release.

---

## 49. MVP Scope

Versi pertama fokus pada:

**Phase 1 — Foundation**

- Laravel project
- React project
- Authentication
- Role Admin / Assessor
- MySQL
- Basic dashboard

**Phase 2 — Assessment**

- Employee CRUD
- Assessment CRUD
- Consent
- Assessment Session
- QR Code

**Phase 3 — Data Forensic**

- JSON Upload
- Storage
- Queue
- JSON Parser
- Activity Log
- Detection Rule
- Log Finding

**Phase 4 — Visual Forensic**

- Screen Casting integration
- OCR integration
- AI Detection integration
- Visual Finding

**Phase 5 — Risk**

- Finding Integration
- Risk Score Engine
- Risk Level

**Phase 6 — Report**

- Report generation
- Dashboard report
- PDF export

**Phase 7 — Security**

- Audit Log
- Data Retention
- Auto-Wipe
- Session expiration
- Security hardening

**Phase 8 — Realtime**

- Laravel Reverb
- Realtime assessment status
- Realtime finding notification

---

## 50. Development Priority

Urutan development:

```text
01. Requirement Finalization
        ↓
02. Database / ERD
        ↓
03. Laravel Setup
        ↓
04. Authentication
        ↓
05. Role & Permission
        ↓
06. Employee Management
        ↓
07. Assessment Management
        ↓
08. Consent
        ↓
09. Assessment Session
        ↓
10. QR Code
        ↓
11. Activity JSON
        ↓
12. Queue & Parser
        ↓
13. Detection Rules
        ↓
14. Findings
        ↓
15. Risk Score
        ↓
16. React Dashboard
        ↓
17. Visual Forensic Integration
        ↓
18. Report
        ↓
19. Audit Log
        ↓
20. Auto-Wipe
        ↓
21. Realtime
        ↓
22. Security Testing
```

---

## 51. Acceptance Criteria

System dianggap memenuhi MVP apabila:

**Authentication**

- Admin dapat login.
- Asesor dapat login.
- User dapat logout.
- Unauthorized user tidak dapat mengakses protected API.

**Employee**

- Admin dapat membuat employee.
- Admin dapat melihat employee.
- Admin dapat mengubah employee.
- Admin dapat menonaktifkan employee.

**Assessment**

- Asesor dapat membuat assessment.
- Assessment memiliki unique ID/code.
- Assessment memiliki employee.
- Assessment memiliki assessor.
- Assessment memiliki status.

**Consent**

- Employee dapat memberikan consent.
- Consent tersimpan.
- Consent memiliki timestamp.
- Assessment tidak dapat dilanjutkan sebelum consent sesuai requirement.
- Employee dapat menarik consent sebelum session dimulai (FR-21).

**Session**

- System dapat membuat session.
- System dapat membuat QR Code.
- QR Code dapat divalidasi.
- Session memiliki expiration.
- Session dapat dihentikan.

**Data Forensic**

- JSON dapat di-upload.
- File divalidasi.
- File disimpan secara aman.
- Processing dilakukan melalui Queue.
- JSON berhasil diparsing.
- Activity Log tersimpan.
- Rule dapat dijalankan.
- Finding dapat dibuat.

**Visual Forensic**

- Screen casting dapat terhubung melalui mekanisme yang dipilih.
- Visual processing dapat mengirim hasil ke backend.
- OCR result dapat disimpan.
- AI detection result dapat disimpan.
- Visual finding dapat dibuat.

**Risk**

- Finding dapat diintegrasikan.
- Risk Score dapat dihitung.
- Risk Level dapat ditentukan berdasarkan konfigurasi/metodologi.
- Risk Score dapat dilihat oleh asesor.

**Report**

- Report dapat dibuat.
- Report dapat dilihat.
- Report memiliki assessment reference.
- Report dapat diekspor jika fitur export sudah diaktifkan.

**Security**

- Role authorization berjalan.
- Audit log berjalan.
- Raw data memiliki retention policy.
- Auto-wipe berjalan sesuai policy.
- Session memiliki expiration.
- File upload tervalidasi.
- Rate limiting aktif (FR-22).

---

## 52. High-Level Architecture

```text
                         NCS ANALYZER
                              |
             +----------------+----------------+
             |                                 |
             v                                 v
      REACT FRONTEND                      EMPLOYEE
             |                                 |
             | REST API                        |
             +---------------+-----------------+
                             |
                             v
                    LARAVEL BACKEND
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
   Authentication       Assessment            Session
        |                    |                    |
        +--------------------+--------------------+
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
          VISUAL FORENSIC          DATA FORENSIC
                 |                       |
          Screen Casting             JSON Upload
                 |                       |
              OCR / AI                 Parser
                 |                       |
                 v                       v
          Visual Finding             Log Finding
                 |                       |
                 +-----------+-----------+
                             |
                             v
                     FINDING ENGINE
                             |
                             v
                    RISK SCORE ENGINE
                             |
                             v
                       RISK PROFILE
                             |
                             v
                          REPORT
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
             SESSION END              AUTO-WIPE
                                         |
                                         v
                                    RAW DATA
```

---

## 53. Final Product Flow

```text
START
  |
  v
LOGIN
  |
  v
CREATE ASSESSMENT
  |
  v
SELECT EMPLOYEE
  |
  v
INFORMED CONSENT
  |
  v
GENERATE QR
  |
  v
EMPLOYEE SCAN QR
  |
  v
ASSESSMENT SESSION
  |
  +-----------------------+
  |                       |
  v                       v
VISUAL FORENSIC       DATA FORENSIC
  |                       |
  v                       v
SCREEN CASTING         JSON DATA
  |                       |
  v                       v
OCR / AI               PARSING
  |                       |
  v                       v
VISUAL FINDING        LOG FINDING
  |                       |
  +-----------+-----------+
              |
              v
       FINDING INTEGRATION
              |
              v
         RISK SCORE ENGINE
              |
              v
          RISK SCORE
              |
              v
        RISK PROFILE REPORT
              |
       +------+------+
       |             |
       v             v
STOP SESSION     AUTO-WIPE
       |          RAW DATA
       +------+------+
              |
              v
             END
```

---

## 54. Future Development

Fitur yang dapat dikembangkan setelah MVP:

- Advanced AI Detection
- Multiple OCR providers
- Advanced Risk Analytics
- Risk Trend
- Assessment Comparison
- Employee Risk History
- Advanced Dashboard
- Realtime Monitoring
- Notification System
- PDF Report Customization
- Export Excel
- Multi-organization support
- Multi-assessor management
- Advanced Audit Trail
- Configurable Risk Engine
- External Security System Integration

---

## 55. Important Design Principle

NCS Analyzer harus menggunakan prinsip:

React sebagai presentation layer, Laravel sebagai business/API layer, database sebagai persistent data layer, dan processing service sebagai specialized analysis layer.

Dengan demikian sistem dapat dikembangkan secara modular tanpa membuat seluruh proses bergantung pada satu komponen.

```text
React            → Presentation
Laravel          → Business Logic / API
MySQL            → Persistent Data
Queue / Redis    → Background Processing
OCR / AI Service → Specialized Processing
Storage          → File Management
```

---

## Catatan Implementasi

> Bagian **screen casting, OCR, dan AI detection** di PRD ini diposisikan sebagai *integration point*, bukan komponen yang otomatis disediakan Laravel. Teknologi konkretnya (lihat Section 10.1) ditentukan setelah requirement teknis final.

---

## Daftar Perubahan dari Versi Sebelumnya

1. Seluruh diagram dipindah ke code block agar format tidak rusak.
2. Penomoran section dirapikan dan konsisten.
3. Status session diselaraskan antara Section 8.3 dan Section 45 (ditambah `processing`, `disconnected`, `cancelled`).
4. Tabel database mengikuti penjelasan teks (tipe kolom + enum status).
5. `updated_at` aktif dan konsisten pada tabel.
6. Section baru:
   - **10.1** — Opsi Teknologi Screen Casting (WebRTC / Desktop Agent / Third-party)
   - **39** — Error Scenarios
   - **41** — Technical Constraints (batas ukuran file, timeout session, rate limit, retention, pagination)
   - **42** — Data Privacy & Compliance (consent withdrawal, right to be forgotten, UU PDP)
   - **48** — Testing Strategy
   - **FR-21** (Consent Withdrawal) dan **FR-22** (Rate Limiting) ditambahkan ke Functional Requirements
7. Section 40 sengaja dikosongkan sebagai cadangan agar penomoran stabil.

END OF PRDOFILE REPORT
              |
       +------+------+
       |             |
       v             v
STOP SESSION     AUTO-WIPE
       |          RAW DATA
       +------+------+
              |
              v
             END
49. Future Development

Fitur yang dapat dikembangkan setelah MVP:

Advanced AI Detection
Multiple OCR providers
Advanced Risk Analytics
Risk Trend
Assessment Comparison
Employee Risk History
Advanced Dashboard
Realtime Monitoring
Notification System
PDF Report Customization
Export Excel
Multi-organization support
Multi-assessor management
Advanced Audit Trail
Configurable Risk Engine
External Security System Integration
50. Important Design Principle

NCS Analyzer harus menggunakan prinsip:

React sebagai presentation layer, Laravel sebagai business/API layer, database sebagai persistent data layer, dan processing service sebagai specialized analysis layer.

Dengan demikian sistem dapat dikembangkan secara modular tanpa membuat seluruh proses bergantung pada satu komponen.

React
  ↓
Presentation

Laravel
  ↓
Business Logic / API

MySQL
  ↓
Persistent Data

Queue / Redis
  ↓
Background Processing

OCR / AI Service
  ↓
Specialized Processing

Storage
  ↓
File Management
END OF PRD

**Catatan penting untuk implementasi:** bagian **screen casting, OCR, dan AI detection** di PRD ini saya posisikan sebagai *integration point*, bukan saya anggap otomatis sudah disediakan Laravel. Nanti kita tentukan teknologi konkretnya setelah requirement teknisnya jelas.

Kalau PRD ini sudah cocok, tahap berikutnya paling enak adalah **kita bikin ERD NCS Analyzer dari tabel-tab