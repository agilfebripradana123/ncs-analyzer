import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    employees: 128,
    assessments: 42,
    active: 5,
  })

  const [riskData, setRiskData] = useState([
    { name: 'Rendah', value: 15, color: '#16A34A' },
    { name: 'Sedang', value: 12, color: '#F59E0B' },
    { name: 'Tinggi', value: 10, color: '#F97316' },
    { name: 'Kritis', value: 5, color: '#DC2626' },
  ])

  const [recentAssessments, setRecentAssessments] = useState([
    {
      id: 'NCS-001',
      employee: 'Agil Febri',
      status: 'active',
      risk: 68,
      date: '2026-09-21',
    },
    {
      id: 'NCS-002',
      employee: 'Budi Santoso',
      status: 'completed',
      risk: 72,
      date: '2026-09-20',
    },
    {
      id: 'NCS-003',
      employee: 'Citra Dewi',
      status: 'processing',
      risk: null,
      date: '2026-09-19',
    },
  ])

  const columns = [
    { 
      key: 'id', 
      header: 'Kode Penilaian', 
      render: (row) => <span className="font-mono text-xs">{row.id}</span> 
    },
    { key: 'employee', header: 'Karyawan' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { 
      key: 'risk', 
      header: 'Skor Risiko', 
      render: (row) => row.risk != null ? (
        <span className={`font-medium ${row.risk >= 70 ? 'text-critical' : row.risk >= 40 ? 'text-warning' : 'text-success'}`}>
          {row.risk}
        </span>
      ) : (
        <span className="text-text-secondary">-</span>
      )
    },
    { 
      key: 'date', 
      header: 'Tanggal', 
      render: (row) => new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Overview sistem NCS Analyzer
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button onClick={() => {}}>
            <Plus size={18} />
            <span className="hidden sm:inline">Penilaian Baru</span>
          </Button>
          <Button variant="secondary" onClick={() => {}}>
            <span className="hidden sm:inline">Kelola Aturan</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card>
          <p className="text-sm text-text-secondary mb-1">Karyawan</p>
          <p className="text-3xl font-bold text-text-primary">{stats.employees}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Penilaian</p>
          <p className="text-3xl font-bold text-text-primary">
            {stats.assessments}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Aktif</p>
          <p className="text-3xl font-bold text-text-primary">{stats.active}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-base md:text-lg font-semibold text-text-primary mb-3 md:mb-4">
            Distribusi Risiko
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding={false} className="lg:col-span-2">
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-base md:text-lg font-semibold text-text-primary">
              Penilaian Terbaru
            </h2>
          </div>
          <div className="p-4 md:p-6">
            <DataTable columns={columns} data={recentAssessments} />
          </div>
        </Card>
      </div>
    </div>
  )
}