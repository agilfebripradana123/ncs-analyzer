import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

export default function AssessmentCreate() {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/assessor/employees', { params: { page: 1, limit: 1000 } })
      .then(({ data }) => {
        const list = data.data || []
        setEmployees(list)
        setFilteredEmployees(list)
      })
      .catch(() => {
        setEmployees([])
        setFilteredEmployees([])
      })
      .finally(() => setEmployeesLoading(false))
  }, [])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredEmployees(employees)
      return
    }
    const q = searchQuery.toLowerCase()
    setFilteredEmployees(
      employees.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          (e.department && e.department.toLowerCase().includes(q))
      )
    )
  }, [searchQuery, employees])

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      toast.error('Pilih karyawan terlebih dahulu')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/assessor/assessments', {
        employee_id: selectedEmployee.id,
      })
      toast.success(data.message || 'Penilaian berhasil dibuat')
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
      </div>

      <Card className="w-full max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-text-primary mb-6">
          Penilaian Baru
        </h2>

        {employeesLoading ? (
          <LoadingState />
        ) : employees.length === 0 ? (
          <EmptyState message="Tidak ada karyawan tersedia" />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">
                Pilih Karyawan
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="mt-2 border border-border rounded-md max-h-48 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-sm text-text-secondary">
                    Tidak ada hasil
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployee(emp)}
                      className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors ${
                        selectedEmployee?.id === emp.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="text-sm font-medium text-text-primary">
                        {emp.name}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {emp.employee_code} • {emp.department || '-'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedEmployee && (
              <div className="p-4 bg-surface-secondary rounded-md border border-border">
                <div className="text-xs text-text-secondary mb-2">
                  Karyawan Terpilih
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-sm">
                    <span className="font-medium">Nama:</span> {selectedEmployee.name}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Departemen:</span>{' '}
                    {selectedEmployee.department || '-'}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/assessor/assessments')}
                disabled={loading}
              >
                Batal
              </Button>
              <Button onClick={handleSubmit} loading={loading} disabled={!selectedEmployee}>
                Mulai Penilaian
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
