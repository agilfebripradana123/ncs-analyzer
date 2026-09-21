import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import LoadingState from '../../components/LoadingState'

export default function ConsentPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [consent, setConsent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .get(`/consent/${token}`)
      .then(({ data }) => setConsent(data.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Persetujuan tidak valid')
        toast.error(err.response?.data?.message || 'Persetujuan tidak valid')
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleApprove = async () => {
    if (!agreed) {
      toast.error('Anda harus membaca dan menyetujui persetujuan')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/consent/${token}/approve`)
      toast.success('Persetujuan diterima')
      navigate('/consent/success')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerima persetujuan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setSubmitting(true)
    try {
      await api.post(`/consent/${token}/decline`)
      toast.success('Persetujuan ditolak')
      navigate('/consent/declined')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak persetujuan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <p className="text-critical">{error}</p>
        </Card>
      </div>
    )

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-4 md:py-8">
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              <ArrowLeft size={16} /> Kembali
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary">NCS ANALYZER</h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">Penilaian Keamanan</p>
        </div>

        <Card className="mb-4">
          <h2 className="text-base md:text-lg font-semibold text-text-primary mb-3 md:mb-4">
            Informasi Penilaian
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-secondary">Karyawan:</span>{' '}
              <span className="font-medium text-text-primary">
                {consent?.employee?.name || '-'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Departemen:</span>{' '}
              <span className="font-medium text-text-primary">
                {consent?.employee?.department || '-'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Penilai:</span>{' '}
              <span className="font-medium text-text-primary">
                {consent?.assessor?.name || '-'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Kode Penilaian:</span>{' '}
              <span className="font-medium text-text-primary">
                {consent?.assessment_code || '-'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-text-primary mb-3 md:mb-4">
            Persetujuan & Privasi
          </h2>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Yang akan dinilai
            </h3>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Aplikasi yang terpasang di perangkat Anda</li>
              <li>Log sistem dan peristiwa keamanan</li>
              <li>Log aktivitas jaringan</li>
              <li>Pengaturan konfigurasi keamanan</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Yang TIDAK akan dinilai
            </h3>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>File dan dokumen pribadi</li>
              <li>Riwayat penjelajahan dan penanda</li>
              <li>Konten email dan pesan</li>
              <li>Foto dan media pribadi</li>
              <li>Kata sandi dan kredensial</li>
            </ul>
          </div>

          <p className="text-xs text-text-secondary">
            Data yang dikumpulkan hanya akan digunakan untuk tujuan penilaian keamanan dan
            akan ditangani sesuai kebijakan privasi perusahaan.
          </p>
        </Card>

        <Card className="mb-4 md:mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-text-primary">
              Saya telah membaca dan memahami ruang lingkup penilaian serta kebijakan privasi. Saya
              menyetujui untuk berpartisipasi dalam penilaian keamanan ini.
            </span>
          </label>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleApprove}
            disabled={!agreed}
            loading={submitting}
            className="flex-1"
          >
            Setuju & Lanjutkan
          </Button>
          <Button
            variant="secondary"
            onClick={handleDecline}
            loading={submitting}
            className="flex-1"
          >
            Tolak
          </Button>
        </div>
      </div>
    </div>
  )
}
