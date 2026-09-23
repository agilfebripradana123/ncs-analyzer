import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

export default function SessionView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/session`)
      setSession(data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat session')
      toast.error(err.response?.data?.message || 'Gagal memuat session')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [id])

  const handleEndSession = async () => {
    setActionLoading(true)
    try {
      await api.post(`/assessor/sessions/${session.id}/end`)
      toast.success('Sesi diakhiri')
      fetchSession()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengakhiri sesi')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error)
    return (
      <EmptyState
        message={error}
        action={<Button onClick={fetchSession}>Coba Lagi</Button>}
      />
    )
  if (!session) return <EmptyState message="Sesi tidak ditemukan" />

  return (
<div>
      <div className="mb-4 md:mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/assessor/sessions')}>
          <ArrowLeft size={16} /> Kembali ke Sesi
        </Button>
      </div>

      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-1">
            Sesi Penilaian
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            {session.assessment?.assessment_code || `#${session.assessment_id}`} — {session.assessment?.employee?.name || 'Karyawan'}
          </p>

          {session.consent_token ? (
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="p-4 md:p-6 bg-surface-secondary rounded-md border border-border">
                <QRCodeSVG value={`${window.location.origin}/consent/${session.consent_token}`} size={160} className="md:w-[200px] md:h-[200px]" />
              </div>
              <p className="text-sm text-text-secondary">
                Scan QR untuk melanjutkan sesi
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-surface-secondary rounded-md border border-border">
              <p className="text-sm text-text-secondary">
                Tidak ada QR code tersedia
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6 text-left">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                Status Sesi
              </p>
              <StatusBadge status={session.status} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                Kadaluarsa
              </p>
              <span className="text-sm text-text-primary">
                {session.expires_at
                  ? new Date(session.expires_at).toLocaleString('id-ID')
                  : '-'}
              </span>
            </div>
          </div>

          <div className="text-left text-sm space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-text-secondary">Dimulai:</span>
              <span className="text-text-primary">
                {session.started_at
                  ? new Date(session.started_at).toLocaleString('id-ID')
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Diakhiri:</span>
              <span className="text-text-primary">
                {session.ended_at
                  ? new Date(session.ended_at).toLocaleString('id-ID')
                  : '-'}
              </span>
            </div>
          </div>

          {session.status === 'active' && (
            <Button
              variant="danger"
              onClick={handleEndSession}
              loading={actionLoading}
              className="w-full"
            >
              Akhiri Sesi
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
}
