import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Select from '../../components/Select'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'consent', label: 'Consent' },
  { value: 'active', label: 'Active' },
]

export default function AssessmentCreate() {
  const [employeeId, setEmployeeId] = useState('')
  const [assessmentCode, setAssessmentCode] = useState('')
  const [assessmentStatus, setAssessmentStatus] = useState('pending')
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/api/admin/employees', { params: { page: 1, limit: 100 } })
      .then(({ data }) => {
        setEmployees((data.data || []).map((emp) => ({ value: emp.id, label: `${emp.name} (${emp.employee_code})` })))
      })
      .catch(() => {
        setEmployees([])
      })
      .finally(() => setEmployeesLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/assessor/assessments', {
        employee_id: employeeId,
        assessment_code: assessmentCode,
        status: assessmentStatus,
      })
      toast.success('Assessment created')
      navigate(`/assessor/assessments/${data.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal create assessment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        Assessment Workspace
      </h1>
      <Card className="w-full max-w-lg">
        <h2 className="text-lg font-semibold text-text-primary mb-6">
          Create Assessment
        </h2>
        {employeesLoading ? (
          <LoadingState />
        ) : employees.length === 0 ? (
          <EmptyState
            message="Tidak ada employees. Tambahkan employee terlebih dahulu."
            action={<Button onClick={() => navigate('/assessor/employees')}>Manage Employees</Button>}
          />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              label="Employee"
              options={employees}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
            <Input
              label="Assessment Code"
              placeholder="NCS-2026-XXXX"
              value={assessmentCode}
              onChange={(e) => setAssessmentCode(e.target.value)}
              required
            />
            <Select
              label="Assessment Status"
              options={STATUS_OPTIONS}
              value={assessmentStatus}
              onChange={(e) => setAssessmentStatus(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/assessor/assessments')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}