import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import DataTable from '../../components/DataTable'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'

export default function AssessorDashboard() {
  const navigate = useNavigate()
  const [stats] = useState({
    active: 5,
    completed: 12,
    pending: 3,
    highRisk: 8,
  })

  const [activeAssessments] = useState([
    {
      id: 1,
      employee: 'Agil Febri',
      department: 'IT',
      status: 'completed',
      findings: 4,
      risk: 62,
      riskLevel: 'HIGH',
    },
    {
      id: 2,
      employee: 'Budi Santoso',
      department: 'Finance',
      status: 'active',
      findings: 2,
      risk: null,
      riskLevel: null,
    },
    {
      id: 3,
      employee: 'Citra Dewi',
      department: 'HR',
      status: 'consent',
      findings: 6,
      risk: 78,
      riskLevel: 'CRITICAL',
    },
  ])

  const columns = [
    { key: 'id', header: 'Kode Penilaian' },
    {
      key: 'employee',
      header: 'Karyawan',
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
    { key: 'findings', header: 'Temuan' },
    {
      key: 'risk',
      header: 'Skor Risiko',
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

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-text-primary">
          Ruang Kerja Penilaian
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card>
          <p className="text-sm text-text-secondary mb-1">Penilaian Aktif</p>
          <p className="text-3xl font-bold text-text-primary">{stats.active}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Penilaian Selesai</p>
          <p className="text-3xl font-bold text-text-primary">{stats.completed}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Persetujuan Tertunda</p>
          <p className="text-3xl font-bold text-text-primary">{stats.pending}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Temuan Risiko Tinggi</p>
          <p className="text-3xl font-bold text-high-risk">{stats.highRisk}</p>
        </Card>
      </div>

        <Card padding={false}>
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-base md:text-lg font-semibold text-text-primary">
              Penilaian Aktif
            </h2>
          </div>
          <div className="p-4 md:p-6">
          <DataTable columns={columns} data={activeAssessments} onRowClick={(row) => navigate(`/assessor/assessments/${row.id}`)} />
        </div>
      </Card>
    </div>
  )
}