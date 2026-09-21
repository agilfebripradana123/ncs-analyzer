import { Plus } from 'lucide-react'
import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import DataTable from '../../components/DataTable'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'assessor', label: 'Assessor' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
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

  const fetchUsers = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/users', { params: { page } })
      setUsers(data.data)
      setMeta(data.meta)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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
        await api.put(`/api/admin/users/${editData.id}`, payload)
        toast.success('User updated')
      } else {
        await api.post('/api/admin/users', payload)
        toast.success('User created')
      }
      setEditModal(false)
      fetchUsers(meta?.current_page || 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan user')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/admin/users/${deleteDialog.id}`)
      toast.success('User deactivated')
      setDeleteDialog(null)
      fetchUsers(meta?.current_page || 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal deactivate user')
    }
  }

  if (loading && users.length === 0) return <LoadingState />

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'created_at', header: 'Created', render: (row) => new Date(row.created_at).toLocaleDateString('id-ID') },
  ]

  const actions = (row) => (
    <>
      <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
        Edit
      </Button>
      <Button size="sm" variant="danger" onClick={() => setDeleteDialog(row)}>
        Delete
      </Button>
    </>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Users</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage Admin and Assessor accounts
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Add User
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState message="Tidak ada users" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            meta={meta}
            onPageChange={(p) => fetchUsers(p)}
            actions={actions}
          />
        </>
      )}

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editData ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
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
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editData}
          />
          <Select
            label="Role"
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
            Save
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Deactivate User"
        message={`Deactivate ${deleteDialog?.name}?`}
      />
    </div>
  )
}