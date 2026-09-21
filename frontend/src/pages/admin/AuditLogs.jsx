import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/audit-logs', {
        params: { page },
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

  if (loading && logs.length === 0) return <LoadingState />

  const columns = [
    { key: 'user_name', header: 'Pengguna', render: (row) => row.user?.name || '-' },
    { key: 'action', header: 'Aksi' },
    { key: 'description', header: 'Deskripsi' },
    {
      key: 'entity_type',
      header: 'Entitas',
      render: (row) => `${row.entity_type} #${row.entity_id}`,
    },
    { key: 'ip_address', header: 'IP' },
    { key: 'created_at', header: 'Waktu', render: (row) => new Date(row.created_at).toLocaleString('id-ID') },
  ]

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-4 md:mb-6">
        Audit Logs
      </h1>

      {logs.length === 0 ? (
        <EmptyState message="Tidak ada log audit" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            meta={meta}
            onPageChange={(p) => fetchLogs(p)}
            rowKey="id"
          />
        </>
      )}
    </div>
  )
}