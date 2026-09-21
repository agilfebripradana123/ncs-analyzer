import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
      .get(`/api/consent/${token}`)
      .then(({ data }) => setConsent(data.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Consent tidak valid')
        toast.error(err.response?.data?.message || 'Consent tidak valid')
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleApprove = async () => {
    if (!agreed) {
      toast.error('Anda harus membaca dan menyetujui consent')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/api/consent/${token}/approve`)
      toast.success('Consent approved')
      navigate('/consent/success')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve consent')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setSubmitting(true)
    try {
      await api.post(`/api/consent/${token}/decline`)
      toast.success('Consent declined')
      navigate('/consent/declined')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal decline consent')
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
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">NCS ANALYZER</h1>
          <p className="text-sm text-text-secondary mt-1">Security Assessment</p>
        </div>

        <Card className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Assessment Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-secondary">Employee:</span>{' '}
              <span className="font-medium text-text-primary">
                {consent?.employee?.name || '-'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Department:</span>{' '}
              <span className="font-medium text-text-primary">
                {consent?.employee?.department || '-'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Assessor:</span>{' '}
              <span className="font-medium text-text-primary">
                {consent?.assessor?.name || '-'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Assessment Code:</span>{' '}
              <span className="font-medium text-text-primary">
                {consent?.assessment_code || '-'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Consent & Privacy
          </h2>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              What will be assessed
            </h3>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Installed applications on your device</li>
              <li>System logs and security events</li>
              <li>Network activity logs</li>
              <li>Security configuration settings</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              What will NOT be assessed
            </h3>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Personal files and documents</li>
              <li>Browsing history and bookmarks</li>
              <li>Email content and messages</li>
              <li>Personal photos and media</li>
              <li>Passwords and credentials</li>
            </ul>
          </div>

          <p className="text-xs text-text-secondary">
            Data collected will be used solely for security assessment purposes and
            will be handled according to company privacy policies.
          </p>
        </Card>

        <Card className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-text-primary">
              I have read and understand the assessment scope and privacy policy. I
              consent to participate in this security assessment.
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
            Approve & Continue
          </Button>
          <Button
            variant="secondary"
            onClick={handleDecline}
            loading={submitting}
            className="flex-1"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}
