import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import SearchInput from '../../components/SearchInput'
import DataTable from '../../components/DataTable'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

const formatDateTime = (iso) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const truncate = (text, max = 80) => text?.length > max ? text.substring(0, max) + '...' : (text || '-')

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const [sortBy, setSortBy] = useState('generated_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const navigate = useNavigate()

  const fetchReports = async (page = 1, q = '') => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/assessor/reports', {
        params: { page, search: q, sort: sortBy, order: sortOrder },
      })
      setReports(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat laporan')
      toast.error(err.response?.data?.message || 'Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    fetchReports(meta?.current_page || 1, search)
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
      key: 'assessment_code',
      header: 'Kode Penilaian',
      sortable: true,
      render: (row) => row.assessment?.assessment_code || '-',
    },
    {
      key: 'employee',
      header: 'Karyawan',
      sortable: false,
      render: (row) => row.assessment?.employee?.name || '-',
    },
    { key: 'total_findings', header: 'Total Temuan', sortable: true },
    {
      key: 'summary',
      header: 'Ringkasan',
      sortable: false,
      render: (row) => truncate(row.summary),
    },
    {
      key: 'generated_at',
      header: 'Tanggal Generate',
      sortable: true,
      render: (row) => formatDateTime(row.generated_at),
    },
  ]

  const actions = (row) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => navigate(`/assessor/assessments/${row.assessment_id}`)}
    >
      Lihat
    </Button>
  )

  const handleSearch = (q) => {
    setSearch(q)
    fetchReports(1, q)
  }

  if (loading && reports.length === 0) return <LoadingState />

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Laporan</h1>
          <p className="text-sm text-text-secondary mt-1">
            Daftar laporan penilaian yang telah digenerate
          </p>
        </div>
      </div>

      <SearchInput value={search} onChange={handleSearch} placeholder="Cari laporan..." />

      {error ? (
        <EmptyState message={error} />
      ) : reports.length === 0 && !loading ? (
        <EmptyState message="Tidak ada laporan" />
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          meta={meta}
          onPageChange={(p) => fetchReports(p, search)}
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