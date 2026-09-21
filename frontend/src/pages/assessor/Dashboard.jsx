import { Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DataTable from '../../components/DataTable'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'

export default function AssessorDashboard() {
  const [stats] = useState({
    active: 5,
    completed: 12,
    pending: 3,
    highRisk: 8,
  })

  const [activeAssessments] = useState([
    {
      id: 'NCS-2026-001',
      employee: 'Agil Febri',
      department: 'IT Department',
      status: 'active',
      findings: 4,
      risk: 62,
      riskLevel: 'HIGH',
    },
    {
      id: 'NCS-2026-002',
      employee: 'Budi Santoso',
      department: 'Finance',
      status: 'processing',
      findings: 2,
      risk: null,
      riskLevel: null,
    },
    {
      id: 'NCS-2026-003',
      employee: 'Citra Dewi',
      department: 'HR',
      status: 'active',
      findings: 6,
      risk: 78,
      riskLevel: 'CRITICAL',
    },
  ])

  const columns = [
    { key: 'id', header: 'Assessment Code' },
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div>
          <div className="font-medium text-text-primary">{row.employee}</div>
          <div className="text-xs text-text-secondary">{row.department}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'findings', header: 'Findings' },
    {
      key: 'risk',
      header: 'Risk Score',
      render: (row) =>
        row.risk ? (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.risk}</span>
            <RiskBadge level={row.riskLevel} />
          </div>
        ) : (
          <span className="text-text-secondary">-</span>
        ),
    },
  ]

  const actions = (row) => (
    <Button size="sm" variant="ghost" onClick={() => {}}>
      View
    </Button>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Assessment Workspace
          </h1>
        </div>
        <Button onClick={() => {}}>
          <Plus size={18} />
          New Assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-sm text-text-secondary mb-1">Active Assessments</p>
          <p className="text-3xl font-bold text-text-primary">{stats.active}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Completed Assessments</p>
          <p className="text-3xl font-bold text-text-primary">{stats.completed}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Pending Consent</p>
          <p className="text-3xl font-bold text-text-primary">{stats.pending}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">High Risk Findings</p>
          <p className="text-3xl font-bold text-high-risk">{stats.highRisk}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Active Assessments
          </h2>
        </div>
        <div className="p-6">
          <DataTable columns={columns} data={activeAssessments} actions={actions} />
        </div>
      </Card>
    </div>
  )
}