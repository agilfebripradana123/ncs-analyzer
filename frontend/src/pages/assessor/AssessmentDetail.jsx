import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, QrCode } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import Tabs from '../../components/Tabs'
import FindingCard from '../../components/FindingCard'
import DeviceStatus from '../../components/DeviceStatus'
import LiveScreen from '../../components/LiveScreen'
import { useDeviceStatus } from '../../hooks/useDeviceStatus'
import RiskScoreCard from '../../components/RiskScoreCard'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import { QRCodeSVG } from 'qrcode.react'

export default function AssessmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [findings, setFindings] = useState([])
  const [riskScore, setRiskScore] = useState(null)
  const [report, setReport] = useState(null)
  const [session, setSession] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [agentCmd, setAgentCmd] = useState(null)
  const { status: deviceStatus, lastSeen } = useDeviceStatus(session)
  const wsUrl = useMemo(
    () => (deviceStatus === 'connected' ? 'ws://127.0.0.1:8091' : null),
    [deviceStatus]
  )

  const fetchDetail = async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const { data } = await api.get(`/assessor/assessments/${id}`)
      if (silent) {
        setAssessment((prev) => (JSON.stringify(prev) === JSON.stringify(data.data) ? prev : data.data))
      } else {
        setAssessment(data.data)
        if (['pending_consent', 'consented', 'active', 'processing'].includes(data.data?.status)) fetchSession()
      }
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || 'Gagal memuat detail')
        toast.error(err.response?.data?.message || 'Gagal memuat detail')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const fetchFindings = async () => {
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/findings`)
      setFindings(data.data)
    } catch {}
  }

  const fetchRiskScore = async () => {
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/risk-score`)
      setRiskScore(data.data)
    } catch {}
  }

  const fetchReport = async () => {
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/report`)
      setReport(data.data)
    } catch {}
  }

  const fetchSession = async (silent = false) => {
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/session`)
      if (silent) {
        setSession((prev) => (JSON.stringify(prev) === JSON.stringify(data.data) ? prev : data.data))
      } else {
        setSession(data.data)
      }
    } catch {}
  }

  useEffect(() => { fetchDetail() }, [id])
  useEffect(() => {
    if (activeTab === 'findings') fetchFindings()
    if (activeTab === 'live') { fetchFindings(); if (!session) fetchSession() }
    if (activeTab === 'risk') fetchRiskScore()
    if (activeTab === 'report') fetchReport()
    if (activeTab === 'session' && !session) fetchSession()
  }, [activeTab])

  // Auto-refresh visual findings while on live tab
  useEffect(() => {
    if (activeTab !== 'live') return
    const t = setInterval(fetchFindings, 3000)
    return () => clearInterval(t)
  }, [activeTab])

  // Auto-refresh saat menunggu consent karyawan
  useEffect(() => {
    if (loading || !assessment) return
    if (!['pending_consent', 'consented'].includes(assessment?.status)) return
    const t = setInterval(() => {
      fetchDetail(true)
      fetchSession(true)
    }, 5000)
    return () => clearInterval(t)
  }, [assessment?.status, loading])

  // Polling device status saat assessment active
  useEffect(() => {
    if (!assessment) return
    if (!['active', 'processing'].includes(assessment.status)) return
    const t = setInterval(() => fetchSession(true), 3000)
    return () => clearInterval(t)
  }, [assessment?.status])

  const handleAction = async (action) => {
    setActionLoading(true)
    try {
      await api.post(`/assessor/assessments/${id}/${action}`)
      toast.success(`${action} berhasil`)
      await Promise.all([fetchDetail(), fetchSession()])
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal ${action}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleIssueAgentToken = async () => {
    setActionLoading(true)
    try {
      const { data } = await api.post(`/assessor/assessments/${id}/agent/token`)
      const { session_id, agent_token } = data.data
      setAgentCmd({ session_id, agent_token })
      await navigator.clipboard.writeText(`python agent.py --session-id ${session_id} --token ${agent_token}`)
      toast.success('Command disalin ke clipboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate agent token')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <EmptyState message={error} action={<Button onClick={fetchDetail}>Coba Lagi</Button>} />
  if (!assessment) return <EmptyState message="Assessment tidak ditemukan" />

  const a = assessment
  const status = a.status
  const canStart = status === 'consented'
  const canComplete = ['active', 'processing'].includes(status)
  const canCalculate = ['active', 'processing'].includes(status) && !riskScore

  const tabs = [
    { id: 'overview', label: 'Ikhtisar' },
    { id: 'live', label: 'Live' },
    { id: 'findings', label: 'Temuan' },
    { id: 'session', label: 'Sesi' },
    { id: 'risk', label: 'Skor Risiko' },
    { id: 'report', label: 'Laporan' },
  ]

  return (
    <div>
      <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/assessor/assessments')}>
              <ArrowLeft size={16} /> Kembali
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold text-text-primary">
              Assessment #{a.assessment_code || a.id}
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {a.employee?.name || '-'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <StatusBadge status={status} />
          <DeviceStatus status={deviceStatus} lastSeen={lastSeen} />
          {canStart && (
            <Button onClick={() => handleAction('start')} loading={actionLoading}>
              Mulai
            </Button>
          )}
          {canComplete && (
            <Button variant="secondary" onClick={() => handleAction('complete')} loading={actionLoading}>
              Selesai
            </Button>
          )}
          {canCalculate && (
            <Button variant="ghost" onClick={() => handleAction('risk-score/calculate')} loading={actionLoading}>
              Hitung
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Karyawan</p>
          <p className="text-sm font-medium text-text-primary">{a.employee?.name || '-'}</p>
          <p className="text-xs text-text-secondary mt-0.5">{a.employee?.department || ''}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Penilai</p>
          <p className="text-sm font-medium text-text-primary">{a.assessor?.name || '-'}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Sesi</p>
          <p className="text-sm font-medium text-text-primary">{a.session?.status || '-'}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Risiko</p>
          <p className="text-sm font-medium text-text-primary">{a.riskScore?.score ?? '-'}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="px-4 md:px-6 pt-3 md:pt-4 overflow-x-auto">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="p-4 md:p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-semibold text-text-primary mb-3">Informasi Penilaian</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-text-secondary">Kode</span><span className="font-medium text-text-primary">{a.assessment_code || a.id}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Status</span><StatusBadge status={status} /></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Dibuat</span><span className="text-text-primary">{new Date(a.created_at).toLocaleString('id-ID')}</span></div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-3">Informasi Sesi</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-text-secondary">Status</span><span className="text-text-primary">{a.session?.status || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Persetujuan</span><span className="text-text-primary">{a.consent?.status || '-'}</span></div>
                </div>
                {a.session?.consent_token && (
                  <div className="mt-4 p-4 bg-surface-secondary rounded-md border border-border flex flex-col items-center gap-3">
                    <QRCodeSVG value={`${window.location.origin}/consent/${a.session.consent_token}`} size={140} />
                    <p className="text-xs text-text-secondary">Scan QR untuk consent karyawan</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <DeviceStatus status={deviceStatus} lastSeen={lastSeen} />
                <span className="text-xs text-text-secondary">
                  Capture: {deviceStatus === 'connected' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <LiveScreen wsUrl={wsUrl} />
                <div>
                  <h3 className="font-semibold text-text-primary mb-3">Temuan Terkini</h3>
                  {findings.length === 0 ? (
                    <p className="text-sm text-text-secondary">No findings yet</p>
                  ) : (
                    <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                      {findings.map(f => <FindingCard key={f.id} finding={f} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'findings' && (
            findings.length === 0 ? <EmptyState message="Tidak ada temuan" /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {findings.map((f) => <FindingCard key={f.id} finding={f} />)}
              </div>
            )
          )}

          {activeTab === 'session' && (
            session ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Status Sesi</p>
                    <StatusBadge status={session.status} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Dimulai</p>
                    <p className="text-sm text-text-primary">{session.started_at ? new Date(session.started_at).toLocaleString('id-ID') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Diakhiri</p>
                    <p className="text-sm text-text-primary">{session.ended_at ? new Date(session.ended_at).toLocaleString('id-ID') : '-'}</p>
                  </div>
                </div>
                {['active', 'processing'].includes(status) && (
                  <div className="p-4 bg-surface-secondary rounded-md border border-border space-y-3">
                    <div>
                      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Jalankan Capture Agent</p>
                      <p className="text-xs text-text-secondary">
                        Jalankan command ini di mesin capture (folder capture-agent). Tanpa edit .env manual.
                      </p>
                    </div>
                    {agentCmd ? (
                      <>
                        <code className="block p-3 bg-surface rounded-md text-xs text-text-primary break-all select-all">
                          python agent.py --session-id {agentCmd.session_id} --token "{agentCmd.agent_token}"
                        </code>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(`python agent.py --session-id ${agentCmd.session_id} --token "${agentCmd.agent_token}"`)}>
                            Salin Ulang
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button size="sm" onClick={handleIssueAgentToken} loading={actionLoading}>
                        Generate Command
                      </Button>
                    )}
                  </div>
                )}
                {session.consent_token && (
                  <div className="mt-4 p-4 md:p-6 bg-surface-secondary rounded-md border border-border flex flex-col items-center gap-3 max-w-xs">
                    <QrCode size={20} className="text-text-secondary" />
                    <QRCodeSVG value={`${window.location.origin}/consent/${session.consent_token}`} size={160} />
                    <p className="text-xs text-text-secondary">Pindai untuk melanjutkan</p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="Belum ada sesi" action={<Button onClick={() => handleAction('session')}>Buat Sesi</Button>} />
            )
          )}

          {activeTab === 'risk' && (
            riskScore ? (
              <RiskScoreCard
                score={riskScore.score}
                level={riskScore.level}
                breakdown={{ visual: riskScore.visual_score, log: riskScore.log_score }}
              />
            ) : (
              <EmptyState message="Belum ada skor risiko" action={<Button onClick={() => handleAction('risk-score/calculate')}>Hitung</Button>} />
            )
          )}

          {activeTab === 'report' && (
            report ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-text-secondary">Karyawan:</span> <span className="font-medium text-text-primary">{a.employee?.name || '-'}</span></div>
                  <div><span className="text-text-secondary">Penilaian:</span> <span className="font-medium text-text-primary">{a.assessment_code || a.id}</span></div>
                  <div><span className="text-text-secondary">Penilai:</span> <span className="font-medium text-text-primary">{a.assessor?.name || '-'}</span></div>
                  <div><span className="text-text-secondary">Tanggal:</span> <span className="font-medium text-text-primary">{new Date(a.created_at).toLocaleDateString('id-ID')}</span></div>
                  <div><span className="text-text-secondary">Status:</span> <StatusBadge status={status} /></div>
                  <div><span className="text-text-secondary">Tingkat Risiko:</span> <span className="font-medium text-text-primary">{riskScore?.level || '-'}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => navigate(`/assessor/reports/${id}`)}>
                    Lihat Detail Lengkap
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAction('report')} loading={actionLoading}>
                    Generate Ulang
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState message="Belum ada laporan" action={<Button onClick={() => handleAction('report')}>Buat Laporan</Button>} />
            )
          )}
        </div>
      </Card>
    </div>
  )
}