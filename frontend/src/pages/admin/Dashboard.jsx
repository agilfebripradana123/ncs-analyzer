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
    { name: 'Low', value: 15, color: '#16A34A' },
    { name: 'Medium', value: 12, color: '#F59E0B' },
    { name: 'High', value: 10, color: '#F97316' },
    { name: 'Critical', value: 5, color: '#DC2626' },
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
    { key: 'id', header: 'Assessment Code' },
    { key: 'employee', header: 'Employee' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'risk', header: 'Risk Score', render: (row) => row.risk || '-' },
    { key: 'date', header: 'Date' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Overview sistem NCS Analyzer
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => {}}>
            <Plus size={18} />
            New Assessment
          </Button>
          <Button variant="secondary" onClick={() => {}}>
            Manage Rules
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-text-secondary mb-1">Employees</p>
          <p className="text-3xl font-bold text-text-primary">{stats.employees}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Assessments</p>
          <p className="text-3xl font-bold text-text-primary">
            {stats.assessments}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Active</p>
          <p className="text-3xl font-bold text-text-primary">{stats.active}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Risk Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
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

        <Card padding={false}>
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              Recent Assessments
            </h2>
          </div>
          <div className="p-6">
            <DataTable columns={columns} data={recentAssessments} />
          </div>
        </Card>
      </div>
    </div>
  )
}