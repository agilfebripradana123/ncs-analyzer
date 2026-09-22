import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import SearchInput from '../../components/SearchInput'
import DataTable from '../../components/DataTable'
import Badge from '../../components/Badge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

const formatDateTime = (iso) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const severityVariant = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'blue' }

export default function Findings() {
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const [sortBy, setSortBy] = useState('detected_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const fetchFindings = async (page = 1, q = '') => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/assessor/findings', {
        params: { page, search: q, sort: sortBy, order: sortOrder },
      })
      setFindings(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat temuan')
      toast.error(err.response?.data?.message || 'Gagal memuat temuan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFindings()
  }, [])

  const columns = [
    { key: 'type', header: 'Tipe', sortable: true },
    { key: 'description', header: 'Deskripsi', sortable: false },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row) => <Badge variant={severityVariant[row.severity] || 'default'}>{row.severity}</Badge>,
    },
    {
      key: 'employee',
      header: 'Karyawan',
      sortable: false,
      render: (row) => row.assessment?.employee?.name || '-',
    },
    {
      key: 'assessment_code',
      header: 'Kode Penilaian',
      sortable: false,
      render: (row) => row.assessment?.assessment_code || '-',
    },
    {
      key: 'detected_at',
      header: 'Terdeteksi',
      sortable: true,
      render: (row) => formatDateTime(row.detected_at),
    },
  ]

  const handleSearch = (q) => {
    setSearch(q)
    fetchFindings(1, q)
  }

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  useEffect(() => {
    fetchFindings(meta?.current_page || 1, search)
  }, [sortBy, sortOrder])

  if (loading && findings.length === 0) return <LoadingState />

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Temuan</h1>
          <p className="text-sm text-text-secondary mt-1">
            Daftar temuan monitoring karyawan
          </p>
        </div>
      </div>

      <SearchInput value={search} onChange={handleSearch} placeholder="Cari temuan..." />

      {error ? (
        <EmptyState message={error} />
      ) : findings.length === 0 && !loading ? (
        <EmptyState message="Tidak ada temuan" />
      ) : (
        <DataTable
          columns={columns}
          data={findings}
          loading={loading}
          meta={meta}
          onPageChange={(p) => fetchFindings(p, search)}
          sortable
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
    </div>
  )
}