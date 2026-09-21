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
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const TYPE_OPTIONS = [
  { value: 'visual', label: 'Visual' },
  { value: 'log', label: 'Log' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export default function Rules() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [editModal, setEditModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    type: '',
    severity: '',
    status: 'active',
  })

  const fetchRules = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/rules', { params: { page } })
      setRules(data.data)
      setMeta(data.meta)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const openCreate = () => {
    setEditData(null)
    setForm({ name: '', type: '', severity: '', status: 'active' })
    setEditModal(true)
  }

  const openEdit = (rule) => {
    setEditData(rule)
    setForm({
      name: rule.name,
      type: rule.type,
      severity: rule.severity,
      status: rule.status,
    })
    setEditModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editData) {
        await api.put(`/api/admin/rules/${editData.id}`, form)
        toast.success('Rule updated')
      } else {
        await api.post('/api/admin/rules', form)
        toast.success('Rule created')
      }
      setEditModal(false)
      fetchRules(meta?.current_page || 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan rule')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/admin/rules/${deleteDialog.id}`)
      toast.success('Rule deactivated')
      setDeleteDialog(null)
      fetchRules(meta?.current_page || 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal deactivate rule')
    }
  }

  if (loading && rules.length === 0) return <LoadingState />

  const severityVariant = {
    low: 'success',
    medium: 'warning',
    high: 'high',
    critical: 'danger',
  }

  const columns = [
    { key: 'name', header: 'Rule Name' },
    { key: 'type', header: 'Type' },
    { key: 'pattern', header: 'Pattern' },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => (
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded ${
            severityVariant[row.severity]
              ? {
                  success: 'bg-success/10 text-success',
                  warning: 'bg-warning/10 text-warning',
                  high: 'bg-high-risk/10 text-high-risk',
                  danger: 'bg-critical/10 text-critical',
                }[severityVariant[row.severity]]
              : 'bg-surface-secondary text-text-secondary'
          }`}
        >
          {row.severity?.toUpperCase()}
        </span>
      ),
    },
    { key: 'risk_weight', header: 'Risk Weight' },
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
        Delete
      </Button>
    </>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Detection Rules
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage assessment detection rules
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState message="Tidak ada rules" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rules}
            loading={loading}
            meta={meta}
            onPageChange={(p) => fetchRules(p)}
            actions={actions}
          />
        </>
      )}

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editData ? 'Edit Rule' : 'Create Rule'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
          />
          <Select
            label="Severity"
            options={SEVERITY_OPTIONS}
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
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
        title="Delete Rule"
        message={`Delete ${deleteDialog?.name}?`}
      />
    </div>
  )
}