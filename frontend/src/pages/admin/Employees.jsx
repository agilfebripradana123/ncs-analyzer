import { Plus } from 'lucide-react'
import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Input from '../../components/Input'
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
      const { data } = await api.get('/api/admin/employees', {
        params: { page, search: q },
      })
      setEmployees(data.data)
      setMeta(data.meta)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat employees')
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
        await api.put(`/api/admin/employees/${editData.id}`, form)
        toast.success('Employee updated')
      } else {
        await api.post('/api/admin/employees', form)
        toast.success('Employee created')
      }
      setEditModal(false)
      fetchEmployees(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan employee')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/admin/employees/${deleteDialog.id}`)
      toast.success('Employee deactivated')
      setDeleteDialog(null)
      fetchEmployees(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal deactivate employee')
    }
  }

  if (loading && employees.length === 0) return <LoadingState />

  const columns = [
    { key: 'employee_code', header: 'Employee Code' },
    { key: 'name', header: 'Name' },
    { key: 'department', header: 'Department' },
    { key: 'position', header: 'Position' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  const actions = (row) => (
    <>
      <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => setDeleteDialog(row)}
      >
        Disable
      </Button>
    </>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Employees</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage employee assessment subjects
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Add Employee
        </Button>
      </div>

      {employees.length === 0 ? (
        <EmptyState message="Tidak ada employees" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={employees}
            loading={loading}
            meta={meta}
            onPageChange={(p) => fetchEmployees(p, search)}
            actions={actions}
          />
        </>
      )}

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editData ? 'Edit Employee' : 'Create Employee'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Employee Code"
            value={form.employee_code}
            onChange={(e) =>
              setForm({ ...form, employee_code: e.target.value })
            }
            required
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            required
          />
          <Input
            label="Position"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
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
        title="Deactivate Employee"
        message={`Deactivate ${deleteDialog?.name}?`}
      />
    </div>
  )
}