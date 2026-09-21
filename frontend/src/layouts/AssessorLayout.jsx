import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Monitor,
  SearchCheck,
  FileText,
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const menuItems = [
  {
    label: 'IKHTISAR',
    items: [
      { path: '/assessor/dashboard', label: 'Dasbor', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'PENILAIAN',
    items: [
      { path: '/assessor/assessments', label: 'Penilaian', icon: <ClipboardCheck size={18} /> },
      { path: '/assessor/employees', label: 'Karyawan', icon: <Users size={18} /> },
      { path: '/assessor/sessions', label: 'Sesi', icon: <Monitor size={18} /> },
      { path: '/assessor/findings', label: 'Temuan', icon: <SearchCheck size={18} /> },
      { path: '/assessor/reports', label: 'Laporan', icon: <FileText size={18} /> },
    ],
  },
]

export default function AssessorLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={menuItems} />
      <div className="md:ml-60">
        <Topbar />
        <main className="mt-16 p-4 md:p-6 lg:p-8 max-w-[1600px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}