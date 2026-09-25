import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'

const RISK_COLORS = {
  low: '#16A34A',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#DC2626',
}

const RISK_LABELS = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  critical: 'Kritis',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const { data: res } = await api.get('/admin/dashboard/stats')
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const riskData = useMemo(() => {
    if (!data?.risk_distribution) return []
    return Object.entries(data.risk_distribution).map(([key, value]) => ({
      name: RISK_LABELS[key] || key,
      value,
      color: RISK_COLORS[key] || '#999',
    }))
  }, [data])

  const columns = [
    {
      key: 'assessment_code',
      header: 'Kode Penilaian',
      render: (row) => <span className="font-mono text-xs">{row.assessment_code || `#${row.id}`}</span>,
    },
    {
      key: 'employee',
      header: 'Karyawan',
      render: (row) => row.employee?.name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'risk_score',
      header: 'Skor Risiko',
      render: (row) => {
        const score = row.risk_score?.score
        if (score == null) return <span className="text-text-secondary">-</span>
        return (
          <span className={`font-medium ${score >= 70 ? 'text-critical' : score >= 40 ? 'text-warning' : 'text-success'}`}>
            {score}
          </span>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Tanggal',
      render: (row) => row.created_at
        ? new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-',
    },
  ]

  if (loading) return <LoadingState />

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
          <Button onClick={() => navigate('/admin/assessments/create')}>
            <Plus size={18} />
            <span className="hidden sm:inline">Penilaian Baru</span>
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/rules')}>
            <span className="hidden sm:inline">Kelola Aturan</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card>
          <p className="text-sm text-text-secondary mb-1">Penilaian</p>
          <p className="text-3xl font-bold text-text-primary">{data?.counts?.assessments ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">Aktif</p>
          <p className="text-3xl font-bold text-text-primary">{data?.counts?.active ?? 0}</p>
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
            <DataTable columns={columns} data={data?.recent_assessments || []} />
          </div>
        </Card>
      </div>
    </div>
  )
}
