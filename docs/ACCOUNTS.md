# NCS Analyzer — Development Accounts

> ⚠️ **Hanya untuk development / testing.**
> Jangan gunakan password ini di production.

---

## Admin

| Field | Value |
|---|---|
| Email | `admin@ncs-analyzer.test` |
| Password | `Admin123!` |
| Role | admin |

## Assessor

| Field | Value |
|---|---|
| Email | `assessor@ncs-analyzer.test` |
| Password | `Assessor123!` |
| Role | assessor |

---

## Storage

Akun disimpan di database `ncs_analyzer`, table `users`.
Seeder: `AdminSeeder` (jalankan via `php artisan db:seed --class=AdminSeeder`).
Assessor bisa dibuat manual atau lewat API nanti.
