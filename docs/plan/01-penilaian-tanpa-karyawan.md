# Plan 01 — Penilaian Tanpa Tabel Karyawan — DONE

Tanggal: 2026-09-25
Status: DONE (36 test pass, build OK)

## Tujuan
Form penilaian baru pakai input langsung (Nama, Instansi, Keterangan). Hapus tabel `employees` sepenuhnya.

## Yang sudah dibuat

### Backend
- Migration `2026_09_25_013325_add_direct_employee_fields_to_assessments_table`: tambah `employee_name`, `employee_department`, `description` nullable; `employee_id` nullable.
- Migration `2026_09_25_014945_drop_employees_table`: drop FK + kolom `employee_id`, drop tabel `employees`.
- `Assessment` model: fillable `employee_name`, `employee_department`, `description`; hapus relation `employee()`.
- `StoreAssessmentRequest`: `employee_name` required, `employee_department` + `description` optional.
- `AssessmentController@store` + `show`/`index`: tanpa `employee`, simpan field langsung.
- Resources `Assessment`/`Finding`/`Session`/`Report`, `ConsentController`, `DashboardController`, `FindingController`/`SessionController`/`ReportController` search → `employee_name`.
- Hapus: `Employee` model, `EmployeeResource`, `Admin/Assessor EmployeeController`, `Store/UpdateEmployeeRequest`, `EmployeeFactory`.
- Update: `DummyDataSeeder`, `AssessmentFactory`, `AgentE2ETest`.

### Frontend
- `AssessmentCreate.jsx` rewrite: 3 input (Nama, Instansi, Keterangan).
- Hapus `pages/admin/Employees.jsx`, `pages/assessor/Employees.jsx`, route + sidebar menu Karyawan.
- `admin/Dashboard.jsx`: grid 3→2 (hapus card Karyawan).

## Verifikasi
`php artisan test` 36 pass, `npm run build` OK.
