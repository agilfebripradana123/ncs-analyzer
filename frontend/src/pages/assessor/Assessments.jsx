import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import SearchInput from '../../components/SearchInput'
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
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const navigate = useNavigate()

  const fetchAssessments = async (page = 1, q = '') => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/assessor/assessments', {
        params: { page, search: q, sort: sortBy, order: sortOrder },
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

  useEffect(() => {
    fetchAssessments(meta?.current_page || 1, search)
  }, [sortBy, sortOrder])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const columns = [
    { key: 'assessment_code', header: 'Kode Penilaian', sortable: true },
    {
      key: 'employee',
      header: 'Karyawan',
      sortable: false,
      render: (row) => row.employee?.name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'risk',
      header: 'Risiko',
      sortable: true,
      render: (row) => row.risk_score?.score ?? '-',
    },
    {
      key: 'date',
      header: 'Tanggal',
      sortable: true,
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

      <SearchInput value={search} onChange={handleSearch} placeholder="Cari penilaian..." />

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
            sortable
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </>
      )}
    </div>
  )
}