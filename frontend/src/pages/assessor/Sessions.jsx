import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import SearchInput from '../../components/SearchInput'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

const formatDateTime = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const truncateToken = (token) => token?.substring(0, 16) + '...' || '-'

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const [sortBy, setSortBy] = useState('started_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const navigate = useNavigate()

  const fetchSessions = async (page = 1, q = '') => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/assessor/sessions', {
        params: { page, search: q, sort: sortBy, order: sortOrder },
      })
      setSessions(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat sesi')
      toast.error(err.response?.data?.message || 'Gagal memuat sesi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    fetchSessions(meta?.current_page || 1, search)
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
    {
      key: 'session_token',
      header: 'Token Sesi',
      sortable: true,
      render: (row) => <span className="font-mono text-xs">{truncateToken(row.session_token)}</span>,
    },
    {
      key: 'employee',
      header: 'Karyawan',
      sortable: false,
      render: (row) => row.assessment?.employee?.name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'started_at',
      header: 'Mulai',
      sortable: true,
      render: (row) => formatDateTime(row.started_at),
    },
    {
      key: 'expires_at',
      header: 'Kadaluarsa',
      sortable: true,
      render: (row) => formatDateTime(row.expires_at),
    },
  ]

  const actions = (row) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => navigate(`/assessor/sessions/${row.assessment_id}`)}
    >
      Lihat
    </Button>
  )

  const handleSearch = (q) => {
    setSearch(q)
    fetchSessions(1, q)
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Sesi Penilaian</h1>
          <p className="text-sm text-text-secondary mt-1">
            Daftar sesi monitoring karyawan
          </p>
        </div>
      </div>

      <SearchInput value={search} onChange={handleSearch} placeholder="Cari karyawan..." />

      {error ? (
        <EmptyState message={error} action={<Button onClick={() => fetchSessions()}>Coba Lagi</Button>} />
      ) : sessions.length === 0 && !loading ? (
        <EmptyState message="Tidak ada sesi" />
      ) : (
        <DataTable
          columns={columns}
          data={sessions}
          loading={loading}
          meta={meta}
          onPageChange={(p) => fetchSessions(p, search)}
          actions={actions}
          sortable
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
    </div>
  )
}
