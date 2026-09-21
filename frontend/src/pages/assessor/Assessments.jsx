import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

export default function Assessments() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const navigate = useNavigate()

  const fetchAssessments = async (page = 1, q = '') => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/assessor/assessments', {
        params: { page, search: q },
      })
      setAssessments(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat penilaian')
      toast.error(err.response?.data?.message || 'Gagal memuat penilaian')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  const columns = [
    { key: 'assessment_code', header: 'Penilaian' },
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
      key: 'risk',
      header: 'Risiko',
      render: (row) => row.risk_score ?? '-',
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString('id-ID')
          : '-',
    },
  ]

  const actions = (row) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => navigate(`/assessor/assessments/${row.id}`)}
    >
      Lihat
    </Button>
  )

  const handleSearch = (q) => {
    setSearch(q)
    fetchAssessments(1, q)
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Penilaian</h1>
        </div>
        <Button onClick={() => navigate('/assessor/assessments/create')}>
          <Plus size={18} />
          <span className="hidden sm:inline">Penilaian Baru</span>
        </Button>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Cari penilaian..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {error ? (
        <EmptyState message={error} action={<Button onClick={() => fetchAssessments()}>Coba Lagi</Button>} />
      ) : assessments.length === 0 && !loading ? (
        <Card>
          <EmptyState message="Tidak ada penilaian" />
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={assessments}
            loading={loading}
            meta={meta}
            onPageChange={(p) => fetchAssessments(p, search)}
            actions={actions}
          />
        </>
      )}
    </div>
  )
}