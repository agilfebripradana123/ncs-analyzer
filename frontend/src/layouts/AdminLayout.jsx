import {
  LayoutDashboard,
  UserCog,
  ShieldCheck,
  ScrollText,
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const menuItems = [
  {
    label: 'IKHTISAR',
    items: [
      { path: '/admin/dashboard', label: 'Dasbor', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'SISTEM',
    items: [
      { path: '/admin/users', label: 'Pengguna', icon: <UserCog size={18} /> },
      { path: '/admin/rules', label: 'Aturan Deteksi', icon: <ShieldCheck size={18} /> },
      { path: '/admin/audit-logs', label: 'Log Audit', icon: <ScrollText size={18} /> },
    ],
  },
]

export default function AdminLayout() {
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