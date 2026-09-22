import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Input from '../../components/Input'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const fetchEmployees = async (page = 1, q = '') => {
    setLoading(true)
    try {
      const { data } = await api.get('/assessor/employees', {
        params: { page, search: q, sort: sortBy, order: sortOrder },
      })
      setEmployees(data.data)
      setMeta(data.meta)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat karyawan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchEmployees(meta?.current_page || 1, search)
  }, [sortBy, sortOrder])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const handleSearch = (q) => {
    setSearch(q)
    fetchEmployees(1, q)
  }

  if (loading && employees.length === 0) return <LoadingState />

  const columns = [
    { key: 'employee_code', header: 'Kode Karyawan', sortable: true },
    { key: 'name', header: 'Nama', sortable: true },
    { key: 'department', header: 'Departemen', sortable: true },
    { key: 'position', header: 'Jabatan', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Karyawan</h1>
          <p className="text-sm text-text-secondary mt-1">
            Daftar karyawan untuk penilaian
          </p>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Cari karyawan..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {employees.length === 0 ? (
        <EmptyState message="Tidak ada data karyawan" />
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          meta={meta}
          onPageChange={(p) => fetchEmployees(p, search)}
          sortable
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
    </div>
  )
}
