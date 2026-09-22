import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import SearchInput from '../../components/SearchInput'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const fetchLogs = async (page = 1, q = '') => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/audit-logs', {
        params: { page, search: q, sort: sortBy, order: sortOrder },
      })
      setLogs(data.data)
      setMeta(data.meta)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat log audit')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSearch = (q) => {
    setSearch(q)
    fetchLogs(1, q)
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
    fetchLogs(meta?.current_page || 1, search)
  }, [sortBy, sortOrder])

  if (loading && logs.length === 0) return <LoadingState />

  const columns = [
    { key: 'user_name', header: 'Pengguna', render: (row) => row.user?.name || '-' },
    { key: 'action', header: 'Aksi' },
    { key: 'description', header: 'Deskripsi' },
    {
      key: 'entity_type',
      header: 'Entitas',
      render: (row) => row.entity_type && row.entity_id ? `${row.entity_type} #${row.entity_id}` : '-',
    },
    { key: 'ip_address', header: 'IP' },
    { key: 'created_at', header: 'Waktu', render: (row) => new Date(row.created_at).toLocaleString('id-ID') },
  ]

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-4 md:mb-6">
        Audit Logs
      </h1>

      <SearchInput value={search} onChange={handleSearch} placeholder="Cari log..." />

      {logs.length === 0 ? (
        <EmptyState message="Tidak ada log audit" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            meta={meta}
            sortable
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onPageChange={(p) => fetchLogs(p, search)}
            rowKey="id"
          />
        </>
      )}
    </div>
  )
}