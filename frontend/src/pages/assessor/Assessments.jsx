import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'

export default function Assessments() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const navigate = useNavigate()

  const fetchAssessments = async (page = 1, q = '') => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/api/assessor/assessments', {
        params: { page, search: q },
      })
      setAssessments(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat assessments')
      toast.error(err.response?.data?.message || 'Gagal memuat assessments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  const columns = [
    { key: 'assessment_code', header: 'Assessment' },
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => row.employee?.name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'risk',
      header: 'Risk',
      render: (row) => row.risk_score ?? '-',
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString('id-ID')
          : '-',
    },
  ]

  const actions = (row) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => navigate(`/assessor/assessments/${row.id}`)}
    >
      View
    </Button>
  )

  const handleSearch = (q) => {
    setSearch(q)
    fetchAssessments(1, q)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Assessments</h1>
        </div>
        <Button onClick={() => navigate('/assessor/assessments/create')}>
          <Plus size={18} />
          New Assessment
        </Button>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search assessment..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {error ? (
        <EmptyState message={error} action={<Button onClick={() => fetchAssessments()}>Retry</Button>} />
      ) : assessments.length === 0 && !loading ? (
        <Card>
          <EmptyState message="Tidak ada assessments" />
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={assessments}
            loading={loading}
            meta={meta}
            onPageChange={(p) => fetchAssessments(p, search)}
            actions={actions}
          />
        </>
      )}
    </div>
  )
}