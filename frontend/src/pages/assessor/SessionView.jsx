import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/api/assessor/assessments/${id}/session`)
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
      await api.post(`/api/assessor/sessions/${session.id}/end`)
      toast.success('Session ended')
      fetchSession()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal end session')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error)
    return (
      <EmptyState
        message={error}
        action={<Button onClick={fetchSession}>Retry</Button>}
      />
    )
  if (!session) return <EmptyState message="Session tidak ditemukan" />

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Assessment Session
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Assessment #{session.assessment_id}
        </p>

        {session.token ? (
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="p-6 bg-surface-secondary rounded-md border border-border">
              <QRCodeSVG value={session.token} size={200} />
            </div>
            <p className="text-sm text-text-secondary">
              Scan untuk melanjutkan
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
              Session Status
            </p>
            <StatusBadge status={session.status} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              QR Status
            </p>
            <StatusBadge status={session.qr_status || 'active'} />
          </div>
        </div>

        <div className="text-left text-sm space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-text-secondary">Started:</span>
            <span className="text-text-primary">
              {session.started_at
                ? new Date(session.started_at).toLocaleString('id-ID')
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Ended:</span>
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
          >
            End Session
          </Button>
        )}
      </Card>
    </div>
  )
}
