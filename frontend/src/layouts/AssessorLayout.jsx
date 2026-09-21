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
    label: 'OVERVIEW',
    items: [
      { path: '/assessor/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'ASSESSMENT',
    items: [
      { path: '/assessor/assessments', label: 'Assessments', icon: <ClipboardCheck size={18} /> },
      { path: '/assessor/employees', label: 'Employees', icon: <Users size={18} /> },
      { path: '/assessor/sessions', label: 'Sessions', icon: <Monitor size={18} /> },
      { path: '/assessor/findings', label: 'Findings', icon: <SearchCheck size={18} /> },
      { path: '/assessor/reports', label: 'Reports', icon: <FileText size={18} /> },
    ],
  },
]

export default function AssessorLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={menuItems} />
      <div className="md:ml-60">
        <Topbar title="Assessor" breadcrumb="NCS Analyzer / Assessment" />
        <main className="mt-16 p-6 lg:p-8 max-w-[1600px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}