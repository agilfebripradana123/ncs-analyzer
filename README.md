# NCS Analyzer

Aplikasi keamanan NCS Analyzer — frontend React + backend Laravel.

## Stack

- Frontend: React 19, Vite, Tailwind CSS, React Router, Lucide React, Recharts
- Backend: Laravel API, Sanctum auth, MySQL (port 3307)

## Menjalankan

```bash
# Backend
cd backend
php artisan serve

# Frontend
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Akun Demo

| Role  | Email                      | Password       |
|-------|----------------------------|----------------|
| Admin    | admin@ncs-analyzer.test     | Admin123!      |
| Assessor | assessor@ncs-analyzer.test  | Assessor123!   |

## Struktur Utama

```
frontend/src/
  pages/admin/      Dashboard, Employees, Users, Rules, AuditLogs
  pages/assessor/   Dashboard, Assessments, AssessmentDetail, AssessmentCreate, SessionView, Employees, Sessions, Findings, Reports
  pages/auth/       Login
  pages/consent/    ConsentPage
  components/       Sidebar, Topbar, Button, Modal, DataTable, Card, StatusBadge, dll
  api/axios.js      axios instance (baseURL http://127.0.0.1:8000/api)
  contexts/AuthContext.jsx  Auth state + token
  layouts/AdminLayout.jsx   /admin/*
  layouts/AssessorLayout.jsx /assessor/*
```

## Catatan Penting

- Axios `baseURL` sudah `/api` — path request **jangan** tambah `/api` di awal.
- Login berhasil setelah seeder password di-hash via `Hash::make()`.
- Reset Vite cache jika perubahan tidak tampil: `rm -rf node_modules/.vite` → restart dev.
- Halaman Karyawan, Sesi, Temuan, Laporan (assessor) masih placeholder kosong.
