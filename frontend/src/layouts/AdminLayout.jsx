import {
  LayoutDashboard,
  Users,
  UserCog,
  ShieldCheck,
  ScrollText,
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const menuItems = [
  {
    label: 'OVERVIEW',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { path: '/admin/employees', label: 'Employees', icon: <Users size={18} /> },
      { path: '/admin/users', label: 'Users', icon: <UserCog size={18} /> },
      { path: '/admin/rules', label: 'Detection Rules', icon: <ShieldCheck size={18} /> },
      { path: '/admin/audit-logs', label: 'Audit Logs', icon: <ScrollText size={18} /> },
    ],
  },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={menuItems} />
      <div className="md:ml-60">
        <Topbar title="Admin" breadcrumb="NCS Analyzer / Admin" />
        <main className="mt-16 p-6 lg:p-8 max-w-[1600px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}