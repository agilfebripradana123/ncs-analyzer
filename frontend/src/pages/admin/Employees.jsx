import { Ban, CheckCircle, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Input from '../../components/Input'
import SearchInput from '../../components/SearchInput'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [editModal, setEditModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const [form, setForm] = useState({
    employee_code: '',
    name: '',
    department: '',
    position: '',
  })

  const fetchEmployees = async (page = 1, q = '') => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/employees', {
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

  const handleSearch = (q) => {
    setSearch(q)
    fetchEmployees(1, q)
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
    fetchEmployees(meta?.current_page || 1, search)
  }, [sortBy, sortOrder])

  const openCreate = () => {
    setEditData(null)
    setForm({ employee_code: '', name: '', department: '', position: '' })
    setEditModal(true)
  }

  const openEdit = (emp) => {
    setEditData(emp)
    setForm({
      employee_code: emp.employee_code,
      name: emp.name,
      department: emp.department,
      position: emp.position,
    })
    setEditModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editData) {
        await api.put(`/admin/employees/${editData.id}`, form)
        toast.success('Karyawan diperbarui')
      } else {
        await api.post('/admin/employees', form)
        toast.success('Karyawan ditambahkan')
      }
      setEditModal(false)
      fetchEmployees(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan karyawan')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/employees/${deleteDialog.id}`)
      toast.success('Karyawan dinonaktifkan')
      setDeleteDialog(null)
      fetchEmployees(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menonaktifkan karyawan')
    }
  }

  const handleReactivate = async (emp) => {
    try {
      await api.put(`/admin/employees/${emp.id}`, { status: 'active' })
      toast.success('Karyawan diaktifkan kembali')
      fetchEmployees(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengaktifkan karyawan')
    }
  }

  if (loading && employees.length === 0) return <LoadingState />

  const columns = [
    { key: 'employee_code', header: 'Kode Karyawan' },
    { key: 'name', header: 'Nama' },
    { key: 'department', header: 'Departemen' },
    { key: 'position', header: 'Jabatan' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  const actions = (row) => (
    <>
      <Button size="sm" variant="ghost" onClick={() => openEdit(row)} aria-label="Ubah">
        <Pencil size={14} />
      </Button>
      {row.status === 'active' ? (
        <Button size="sm" variant="danger" onClick={() => setDeleteDialog(row)} aria-label="Nonaktifkan">
          <Ban size={14} />
        </Button>
      ) : (
        <Button size="sm" variant="success" onClick={() => handleReactivate(row)} aria-label="Aktifkan">
          <CheckCircle size={14} />
        </Button>
      )}
    </>
  )

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Karyawan</h1>
          <p className="text-sm text-text-secondary mt-1">
            Kelola subjek penilaian karyawan
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Karyawan</span>
        </Button>
      </div>

      <SearchInput value={search} onChange={handleSearch} placeholder="Cari karyawan..." />

      {employees.length === 0 ? (
        <EmptyState message="Tidak ada karyawan" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={employees}
            loading={loading}
            meta={meta}
            sortable
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onPageChange={(p) => fetchEmployees(p, search)}
            actions={actions}
          />
        </>
      )}

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editData ? 'Ubah Karyawan' : 'Tambah Karyawan'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!editData && (
            <Input
              label="Kode Karyawan (Otomatis)"
              value="Akan digenerate otomatis"
              disabled
            />
          )}
          {editData && (
            <Input
              label="Kode Karyawan"
              value={form.employee_code}
              disabled
            />
          )}
          <Input
            label="Nama"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Departemen"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            required
          />
          <Input
            label="Jabatan"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            required
          />
          <Button type="submit" loading={formLoading}>
            Simpan
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Nonaktifkan Karyawan"
        message={`Nonaktifkan ${deleteDialog?.name}?`}
      />
    </div>
  )
}