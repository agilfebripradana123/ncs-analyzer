import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'

export default function AssessmentCreate() {
  const [form, setForm] = useState({ employee_name: '', employee_department: '', description: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!form.employee_name.trim()) {
      toast.error('Nama wajib diisi')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/assessor/assessments', form)
      toast.success(data.message || 'Penilaian berhasil dibuat')
      navigate(`/assessor/assessments/${data.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat penilaian')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/assessor/assessments')}>
          <ArrowLeft size={16} /> Kembali
        </Button>
      </div>

      <Card className="w-full max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-text-primary mb-6">Penilaian Baru</h2>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Nama</label>
            <input
              type="text"
              value={form.employee_name}
              onChange={set('employee_name')}
              placeholder="Nama karyawan"
              className="px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Instansi</label>
            <input
              type="text"
              value={form.employee_department}
              onChange={set('employee_department')}
              placeholder="Departemen / instansi"
              className="px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Keterangan</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={4}
              placeholder="Keterangan tambahan (opsional)"
              className="px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate('/assessor/assessments')} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={!form.employee_name.trim()}>
              Mulai Penilaian
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
