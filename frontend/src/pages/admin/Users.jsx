import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Input from '../../components/Input'
import SearchInput from '../../components/SearchInput'
import Select from '../../components/Select'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'assessor', label: 'Penilai' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
]

export default function Users() {
  const [users, setUsers] = useState([])
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
    name: '',
    email: '',
    password: '',
    role: '',
    status: 'active',
  })

  const fetchUsers = async (page = 1, q = '') => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', { params: { page, search: q, sort: sortBy, order: sortOrder } })
      setUsers(data.data)
      setMeta(data.meta)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat pengguna')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSearch = (q) => {
    setSearch(q)
    fetchUsers(1, q)
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
    fetchUsers(meta?.current_page || 1, search)
  }, [sortBy, sortOrder])

  const openCreate = () => {
    setEditData(null)
    setForm({ name: '', email: '', password: '', role: '', status: 'active' })
    setEditModal(true)
  }

  const openEdit = (user) => {
    setEditData(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
    })
    setEditModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const payload = { ...form }
      if (editData && !payload.password) delete payload.password
      if (editData) {
        await api.put(`/admin/users/${editData.id}`, payload)
        toast.success('Pengguna diperbarui')
      } else {
        await api.post('/admin/users', payload)
        toast.success('Pengguna ditambahkan')
      }
      setEditModal(false)
      fetchUsers(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pengguna')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${deleteDialog.id}`)
      toast.success('Pengguna dinonaktifkan')
      setDeleteDialog(null)
      fetchUsers(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menonaktifkan pengguna')
    }
  }

  if (loading && users.length === 0) return <LoadingState />

  const columns = [
    { key: 'name', header: 'Nama' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Peran' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'created_at', header: 'Dibuat', render: (row) => new Date(row.created_at).toLocaleDateString('id-ID') },
  ]

  const actions = (row) => (
    <>
      <Button size="sm" variant="ghost" onClick={() => openEdit(row)} aria-label="Ubah">
        <Pencil size={14} />
      </Button>
      <Button size="sm" variant="danger" onClick={() => setDeleteDialog(row)} aria-label="Hapus">
        <Trash2 size={14} />
      </Button>
    </>
  )

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Pengguna</h1>
          <p className="text-sm text-text-secondary mt-1">
            Kelola akun Admin dan Penilai
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Pengguna</span>
        </Button>
      </div>

      <SearchInput value={search} onChange={handleSearch} placeholder="Cari pengguna..." />

      {users.length === 0 ? (
        <EmptyState message="Tidak ada pengguna" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            meta={meta}
            sortable
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onPageChange={(p) => fetchUsers(p, search)}
            actions={actions}
          />
        </>
      )}

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editData ? 'Ubah Pengguna' : 'Tambah Pengguna'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Kata Sandi"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editData}
          />
          <Select
            label="Peran"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
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
        title="Nonaktifkan Pengguna"
        message={`Nonaktifkan ${deleteDialog?.name}?`}
      />
    </div>
  )
}