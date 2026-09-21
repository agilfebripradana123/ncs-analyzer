import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Select from '../../components/Select'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Tertunda' },
  { value: 'consent', label: 'Persetujuan' },
  { value: 'active', label: 'Aktif' },
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
      .get('/admin/employees', { params: { page: 1, limit: 100 } })
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
      const { data } = await api.post('/assessor/assessments', {
        employee_id: employeeId,
        assessment_code: assessmentCode,
        status: assessmentStatus,
      })
      toast.success('Penilaian dibuat')
      navigate(`/assessor/assessments/${data.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat penilaian')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/assessor/assessments')}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-4 md:mb-6">
          Ruang Kerja Penilaian
        </h1>
      </div>
      <Card className="w-full max-w-lg">
        <h2 className="text-base md:text-lg font-semibold text-text-primary mb-4 md:mb-6">
          Buat Penilaian
        </h2>
        {employeesLoading ? (
          <LoadingState />
        ) : employees.length === 0 ? (
          <EmptyState
            message="Tidak ada karyawan. Tambahkan karyawan terlebih dahulu."
            action={<Button onClick={() => navigate('/assessor/employees')}>Kelola Karyawan</Button>}
          />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              label="Karyawan"
              options={employees}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
            <Input
              label="Kode Penilaian"
              placeholder="NCS-2026-XXXX"
              value={assessmentCode}
              onChange={(e) => setAssessmentCode(e.target.value)}
              required
            />
            <Select
              label="Status Penilaian"
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
                Batal
              </Button>
              <Button type="submit" loading={loading}>
                Buat
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}