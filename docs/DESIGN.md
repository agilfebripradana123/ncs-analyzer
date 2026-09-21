# UI DESIGN PRD — NCS ANALYZER

## 1. Product

Product Name: NCS Analyzer
Product Type: Cybersecurity Assessment & Risk Analysis Platform
Users:
- Admin
- Assessor
- Employee (consent page only)

Frontend:
- React 19
- Vite
- Tailwind CSS

---

## 2. Design Direction

Gunakan referensi visual berupa dashboard SaaS dengan karakter:

- Clean flat design
- Modern enterprise dashboard
- Minimal dan profesional
- Banyak menggunakan white space
- Sidebar kiri fixed
- Content area menggunakan white surface
- Rounded corners medium
- Soft shadow
- Border sangat subtle
- Tidak menggunakan glassmorphism
- Tidak menggunakan neon cyberpunk
- Tidak menggunakan gradient berlebihan
- Tidak menggunakan ilustrasi dekoratif yang tidak diperlukan

UI harus terasa seperti:
"Professional cybersecurity management dashboard"

bukan:
"Cyberpunk / futuristic hacker dashboard"

---

## 3. Color System

Primary:
#2563EB

Primary Dark:
#1D4ED8

Sidebar:
#17243A

Sidebar Active:
#2563EB

Background:
#EEF2FA

Surface:
#FFFFFF

Surface Secondary:
#F5F7FB

Border:
#E2E8F0

Text Primary:
#172033

Text Secondary:
#64748B

Success:
#16A34A

Warning:
#F59E0B

High Risk:
#F97316

Critical:
#DC2626

Gunakan warna primary blue secara konsisten untuk:
- Active navigation
- Primary button
- Links
- Focus state
- Important actions

Jangan menggunakan terlalu banyak warna pada satu halaman.

---

## 4. Typography

Font:
Inter

Typography hierarchy:

Page Title:
24–28px / 600–700

Section Title:
18–20px / 600

Body:
14px / 400–500

Small Text:
12–13px

Table:
13–14px

Gunakan typography yang compact dan mudah dipindai.

Hindari heading yang terlalu besar seperti landing page.

---

## 5. Main Layout

Desktop layout:

┌─────────────────────────────────────────────────────┐
│                     TOPBAR                          │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   SIDEBAR    │              CONTENT                 │
│              │                                      │
│              │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘

Sidebar:
- Fixed left
- Width sekitar 220–240px
- Dark navy
- Full viewport height

Main content:
- Background light blue/gray
- Padding 24–32px
- Maximum content width sekitar 1400–1600px

Content menggunakan white cards untuk area utama.

---

## 6. Sidebar

Sidebar harus sederhana seperti dashboard SaaS pada referensi.

Header:

NCS Analyzer
Security Assessment

Navigation:

OVERVIEW
- Dashboard

ASSESSMENT
- Assessments
- Employees
- Sessions
- Findings
- Reports

SYSTEM
- Detection Rules
- Users
- Audit Logs

Active menu:
- Blue background
- White text
- Rounded right/medium radius
- Subtle visual emphasis

Inactive:
- Muted white/gray text
- Transparent background

Gunakan icon dari lucide-react.

Jangan menggunakan icon berbeda-beda secara visual.

---

## 7. Topbar

Topbar:
- White
- Height sekitar 60–64px
- Border bottom subtle

Isi:

Left:
Breadcrumb / page title

Right:
- Search
- Notification
- User avatar
- User name
- Role
- Dropdown

Contoh:

NCS Analyzer / Assessments

                    🔍  🔔  [A] Agil
                              Assessor

Jangan menambahkan terlalu banyak informasi di topbar.

---

# 8. Dashboard

## Admin Dashboard

Header:

Dashboard
Overview sistem NCS Analyzer

Primary actions:
- New Assessment
- Manage Rules

KPI cards:

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Employees    │ │ Assessments  │ │ Active       │
│ 128          │ │ 42           │ │ 5            │
└──────────────┘ └──────────────┘ └──────────────┘

Kemudian:

┌─────────────────────────┐ ┌─────────────────────┐
│ Risk Distribution       │ │ Recent Assessments  │
│                         │ │                     │
│      Chart              │ │ Assessment list     │
│                         │ │                     │
└─────────────────────────┘ └─────────────────────┘

Dashboard harus informatif dan tidak terlalu penuh.

---

# 9. Assessor Dashboard

Header:

Assessment Workspace

KPI:

- Active Assessments
- Completed Assessments
- Pending Consent
- High Risk Findings

Section:

Active Assessments

Tampilkan assessment dalam compact cards atau table.

Contoh:

┌────────────────────────────────────────────────────┐
│ NCS-2026-001     Agil Febri       ACTIVE          │
│ Employee         IT Department                     │
│ Session Active   Findings: 4       Risk: 62       │
│                                      [View]        │
└────────────────────────────────────────────────────┘

---

# 10. Data Table

Gunakan table biasa.

Style:

- White background
- Header light gray/blue
- Row separator subtle
- Hover light blue
- Compact row height
- No excessive borders

Contoh:

┌─────────────────────────────────────────────────────────┐
│ Assessment │ Employee │ Status │ Risk │ Date │ Action │
├─────────────────────────────────────────────────────────┤
│ NCS-001    │ Agil     │ Active │  —   │ Sep 21 │ View │
│ NCS-002    │ Budi     │ Done   │ 72   │ Sep 20 │ View │
│ NCS-003    │ Citra    │ Review │ 48   │ Sep 19 │ View │
└─────────────────────────────────────────────────────────┘

Pagination:
Previous  1  2  3  4  Next

Default:
20 items / page

---

# 11. Status Badge

Use compact badges.

Pending:
gray / blue-gray

Active:
blue

Processing:
blue

Completed:
green

Cancelled:
gray

Expired:
red

Tidak menggunakan pill terlalu besar.

---

# 12. Risk Badge

LOW:
green

MEDIUM:
amber

HIGH:
orange

CRITICAL:
red

Risk badge harus kecil dan mudah dipindai.

---

# 13. Employee Page

Header:

Employees
Manage employee assessment subjects

Button:
+ Add Employee

Table:

Employee Code
Name
Department
Position
Status
Actions

Actions:
- View
- Edit
- Disable

Create/Edit menggunakan modal atau side dialog sederhana.

---

# 14. Detection Rules

Header:

Detection Rules
Manage assessment detection rules

Button:
+ Add Rule

Table:

Rule Name
Type
Pattern
Severity
Risk Weight
Status
Actions

Gunakan modal untuk Create/Edit.

---

# 15. Users

Header:

Users
Manage Admin and Assessor accounts

Table:

Name
Email
Role
Status
Created
Actions

Role badge:
Admin
Assessor

---

# 16. Assessment Create

Gunakan form sederhana dalam white card.

Fields:

Employee
Assessment Code
Assessment Status

Layout:

┌──────────────────────────────────────┐
│ Create Assessment                    │
│                                      │
│ Employee                             │
│ [ Select employee              ▼ ]   │
│                                      │
│ Assessment Code                     │
│ [ NCS-2026-XXXX               ]     │
│                                      │
│              [Cancel] [Create]       │
└──────────────────────────────────────┘

Jangan membuat form terlalu panjang.

---

# 17. Assessment Detail

Header:

Assessment #NCS-2026-001

Employee:
Agil Febri Pradana

Status:
Active

Overview cards:

Employee
Assessor
Session
Risk

Navigation tabs:

Overview
Findings
Session
Risk Score
Report

Content:

Assessment Information
Session Information
Analysis Status
Finding Summary
Risk Summary

---

# 18. Session View

Session page harus fokus pada status dan QR.

┌─────────────────────────────────────┐
│ Assessment Session                  │
│                                     │
│              QR CODE                │
│                                     │
│       Scan untuk melanjutkan        │
│                                     │
│ Session Status: Waiting             │
│ QR Status: Active                   │
│                                     │
│ [ End Session ]                     │
└─────────────────────────────────────┘

Gunakan qrcode.react.

Jangan membuat realtime palsu.
Realtime indicator hanya ditampilkan jika backend memang mendukungnya.

---

# 19. Findings

Gunakan tabs:

Visual Findings
Log Findings

Finding card:

┌────────────────────────────────────┐
│ HIGH                    92%         │
│ Suspicious Application             │
│                                    │
│ Type: Application                  │
│ Value: Example App                 │
│ Detected: 10:32:21                 │
└────────────────────────────────────┘

Gunakan warna severity secara konsisten.

---

# 20. Risk Score

Gunakan layout sederhana:

┌────────────────────────────────────┐
│ Risk Score                         │
│                                    │
│              68                    │
│             /100                   │
│                                    │
│              HIGH                  │
└────────────────────────────────────┘

Kemudian:

Visual Score     35
Log Score        33
Total Score      68

Tambahkan chart kecil menggunakan Recharts.

Hindari giant gauge / speedometer.

---

# 21. Report

MVP:

Report Overview

- Employee
- Assessment
- Assessor
- Assessment Date
- Status
- Findings Summary
- Risk Score
- Risk Level
- Timeline

Button:

[ View JSON ]

PDF:
Future / disabled state

---

# 22. Employee Consent

Route:

/consent/:token

Mobile-first.

Layout:

        NCS ANALYZER
        Security Assessment

┌────────────────────────┐
│ Assessment Information │
│ Employee               │
│ Department             │
│ Assessor               │
└────────────────────────┘

┌────────────────────────┐
│ Consent & Privacy      │
│                        │
│ What will be assessed  │
│ • ...                  │
│ • ...                  │
│                        │
│ What will NOT be       │
│ assessed               │
│ • ...                  │
│ • ...                  │
└────────────────────────┘

☐ I have read and understand...

[ Approve & Continue ]

[ Decline ]

Tidak menggunakan sidebar/topbar dashboard.

---

# 23. Components

Buat reusable components:

- Sidebar
- Topbar
- Button
- Input
- Select
- Modal
- Dropdown
- DataTable
- Pagination
- StatusBadge
- RiskBadge
- Card
- Tabs
- Toast
- EmptyState
- LoadingState
- ErrorState
- RiskScoreCard
- FindingCard
- ConfirmDialog

---

# 24. Icon System

Gunakan:

lucide-react

Icon mapping:

Dashboard → LayoutDashboard
Employees → Users
Assessments → ClipboardCheck
Sessions → Monitor
Findings → SearchCheck
Reports → FileText
Rules → ShieldCheck
Users → UserCog
Audit Logs → ScrollText
Settings → Settings
Search → Search
Notification → Bell
Add → Plus
Edit → Pencil
Delete → Trash2
QR → QrCode
Risk → ShieldAlert

Jangan menggunakan emoji sebagai icon UI.

---

# 25. Interaction

Animations sangat minimal.

Gunakan hanya:

- hover
- focus
- dropdown
- modal transition
- loading spinner
- toast

Tidak menggunakan:
- parallax
- floating animation
- glowing animation
- excessive motion

---

# 26. Responsive

Desktop:
Sidebar fixed.

Tablet:
Sidebar dapat collapse.

Mobile:
Sidebar menjadi drawer.

Tables:
horizontal scroll jika diperlukan.

Consent:
mobile-first.

Dashboard:
KPI cards menjadi stacked.

---

# 27. Anti-Slop Rules

STRICTLY AVOID:

- Glassmorphism
- Neon cyberpunk
- Excessive gradients
- Excessive rounded cards
- Huge typography
- 3D objects
- Floating blobs
- Decorative cybersecurity illustrations
- Fake terminal windows
- Hacker imagery
- Excessive shadows
- Excessive animations
- Random charts
- Fake statistics
- Fake realtime data
- Excessive pills
- Giant circular gauges

Design should look like a real enterprise cybersecurity management application.

---

# 28. Design Priority

Build in this order:

1. Global styles
2. Sidebar
3. Topbar
4. Buttons
5. Inputs
6. Badges
7. Cards
8. DataTable
9. Admin Layout
10. Assessor Layout
11. Login
12. Admin Dashboard
13. Employees
14. Detection Rules
15. Users
16. Assessor Dashboard
17. Assessments
18. Assessment Detail
19. Session + QR
20. Consent
21. Findings
22. Risk Score
23. Report

---

# 29. Technical UI Rules

Use:

React
Tailwind CSS
Lucide React
Recharts
React Hot Toast
Headless UI

Do not introduce another UI framework.

Use reusable components instead of repeating styles.

Use API-driven data.
Do not hardcode production data.

Provide loading, empty, error, and success states for every data-driven page.