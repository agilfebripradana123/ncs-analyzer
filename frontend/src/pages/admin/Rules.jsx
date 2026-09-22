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

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
  { value: 'critical', label: 'Kritis' },
]

const TYPE_OPTIONS = [
  { value: 'visual', label: 'Visual' },
  { value: 'log', label: 'Log' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
]

export default function Rules() {
  const [rules, setRules] = useState([])
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
    type: '',
    severity: '',
    status: 'active',
  })

  const fetchRules = async (page = 1, q = '') => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/rules', { params: { page, search: q, sort: sortBy, order: sortOrder } })
      setRules(data.data)
      setMeta(data.meta)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat aturan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleSearch = (q) => {
    setSearch(q)
    fetchRules(1, q)
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
    fetchRules(meta?.current_page || 1, search)
  }, [sortBy, sortOrder])

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
        await api.put(`/admin/rules/${editData.id}`, form)
        toast.success('Aturan diperbarui')
      } else {
        await api.post('/admin/rules', form)
        toast.success('Aturan ditambahkan')
      }
      setEditModal(false)
      fetchRules(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan aturan')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/rules/${deleteDialog.id}`)
      toast.success('Aturan dinonaktifkan')
      setDeleteDialog(null)
      fetchRules(meta?.current_page || 1, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menonaktifkan aturan')
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
    { key: 'name', header: 'Nama Aturan' },
    { key: 'type', header: 'Tipe' },
    { key: 'pattern', header: 'Pola' },
    {
      key: 'severity',
      header: 'Tingkat Keparahan',
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
    { key: 'risk_weight', header: 'Bobot Risiko' },
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
      <Button size="sm" variant="danger" onClick={() => setDeleteDialog(row)} aria-label="Hapus">
        <Trash2 size={14} />
      </Button>
    </>
  )

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">
            Aturan Deteksi
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Kelola aturan deteksi penilaian
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Aturan</span>
        </Button>
      </div>

      <SearchInput value={search} onChange={handleSearch} placeholder="Cari aturan..." />

      {rules.length === 0 ? (
        <EmptyState message="Tidak ada aturan" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rules}
            loading={loading}
            meta={meta}
            onPageChange={(p) => fetchRules(p, search)}
            actions={actions}
            sortable
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </>
      )}

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editData ? 'Ubah Aturan' : 'Tambah Aturan'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Tipe"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
          />
          <Select
            label="Tingkat Keparahan"
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
            Simpan
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Hapus Aturan"
        message={`Hapus ${deleteDialog?.name}?`}
      />
    </div>
  )
}