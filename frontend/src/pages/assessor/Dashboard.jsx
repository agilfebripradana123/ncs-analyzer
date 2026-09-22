import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Card from '../../components/Card'
import DataTable from '../../components/DataTable'
import LoadingState from '../../components/LoadingState'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'

export default function AssessorDashboard() {
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null)

  const fetchAssessments = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/assessor/assessments', { params: { page } })
      setAssessments(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat')
      toast.error(err.response?.data?.message || 'Gagal memuat')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  const stats = useMemo(
    () => ({
      active: assessments.filter((a) => a.status === 'active').length,
      completed: assessments.filter((a) => a.status === 'completed').length,
      pending: assessments.filter((a) => a.status === 'pending').length,
      highRisk: assessments.filter((a) => (a.risk_score?.score ?? 0) >= 70).length,
    }),
    [assessments]
  )

  const columns = [
    { key: 'assessment_code', header: 'Kode Penilaian', render: (row) => row.assessment_code || `#${row.id}` },
    {
      key: 'employee',
      header: 'Karyawan',
      render: (row) => (
        <div>
          <div className="font-medium text-text-primary">{row.employee?.name || '-'}</div>
          <div className="text-xs text-text-secondary">{row.employee?.department || '-'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'total_findings',
      header: 'Temuan',
      render: (row) => row.total_findings ?? '-',
    },
    {
      key: 'risk_score',
      header: 'Skor Risiko',
      render: (row) =>
        row.risk_score?.score != null ? (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.risk_score.score}</span>
            <RiskBadge level={row.risk_score.level} />
          </div>
        ) : (
          <span className="text-text-secondary">-</span>
        ),
    },
  ]

  if (loading && assessments.length === 0) return <LoadingState />

  if (error && assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-text-secondary">{error}</p>
        <button
          onClick={() => fetchAssessments()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

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
          <DataTable columns={columns} data={assessments} onRowClick={(row) => navigate(`/assessor/assessments/${row.id}`)} />
        </div>
      </Card>
    </div>
  )
}