import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, QrCode, RefreshCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
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



export default function AssessmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('konsen')
  const [findings, setFindings] = useState([])
  const [visualFindings, setVisualFindings] = useState([])
  const [logFindings, setLogFindings] = useState([])
  const [riskScore, setRiskScore] = useState(null)
  const [report, setReport] = useState(null)
  const [session, setSession] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [agentCmd, setAgentCmd] = useState(null)
  const [activities, setActivities] = useState([])
  const [reprocessing, setReprocessing] = useState(false)
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

  const fetchVisual = async () => {
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/visual-findings`)
      setVisualFindings(data.data || [])
    } catch {}
  }

  const fetchLogFindings = async () => {
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/log-findings`)
      setLogFindings(data.data || [])
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

  const fetchActivities = async () => {
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/activities`)
      setActivities(data.data || [])
    } catch {}
  }

  const handleReprocess = async () => {
    setReprocessing(true)
    try {
      const { data } = await api.post(`/assessor/assessments/${id}/activities/reprocess`)
      toast.success(data.message)
      fetchLogFindings()
      fetchActivities()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal analisis ulang')
    } finally {
      setReprocessing(false)
    }
  }

  useEffect(() => { fetchDetail() }, [id])
  useEffect(() => {
    if (activeTab === 'findings') fetchFindings()
    if (activeTab === 'layer1') { fetchVisual(); if (!session) fetchSession() }
    if (activeTab === 'layer2') { fetchLogFindings(); fetchActivities() }
    if (activeTab === 'risk') fetchRiskScore()
    if (activeTab === 'report') fetchReport()
    if (activeTab === 'session' && !session) fetchSession()
  }, [activeTab])

  // Auto-refresh layer tabs
  useEffect(() => {
    if (activeTab === 'layer1') {
      const t = setInterval(fetchVisual, 3000)
      return () => clearInterval(t)
    }
    if (activeTab === 'layer2') {
      const t = setInterval(() => { fetchLogFindings(); fetchActivities() }, 3000)
      return () => clearInterval(t)
    }
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
      await navigator.clipboard.writeText(`python agent.py --session-id ${session_id} --token "${agent_token}"`)
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
  const statusLabel = {
    pending: 'Pending',
    consented: 'Disetujui',
    cancelled: 'Ditolak',
    draft: 'Draft',
  }
  const canStart = status === 'consented'
  const canComplete = ['active', 'processing'].includes(status)
  const canCalculate = ['active', 'processing'].includes(status) && !riskScore

  const tabs = [
    { id: 'konsen', label: 'Persetujuan' },
    { id: 'layer1', label: 'Layer 1' },
    { id: 'layer2', label: 'Layer 2' },
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
          {activeTab === 'konsen' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-semibold text-text-primary mb-3">Consent Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-text-secondary">Consent</span><StatusBadge status={a.consent?.status || 'pending_consent'} /></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Status Sesi</span><span className="text-text-primary">{a.session?.status || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Status Assessment</span><StatusBadge status={status} /></div>
                </div>
                {a.session?.consent_token && (
                  <div className="mt-4 p-3 bg-surface-secondary rounded-md border border-border text-xs break-all text-text-secondary">
                    Link persetujuan: <a className="text-primary underline" href={`${window.location.origin}/consent/${a.session.consent_token}`} target="_blank" rel="noreferrer">{`${window.location.origin}/consent/${a.session.consent_token}`}</a>
                  </div>
                )}
              </div>
              <div>
                {a.session?.consent_token ? (
                  <div className="p-4 bg-surface-secondary rounded-md border border-border flex flex-col items-center gap-3 max-w-xs">
                    <QrCode size={20} className="text-text-secondary" />
                    <QRCodeSVG value={`${window.location.origin}/consent/${a.session.consent_token}`} size={180} />
                    <p className="text-xs text-text-secondary">Scan QR untuk persetujuan karyawan</p>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">Belum ada token consent</p>
                )}
              </div>
            </div>
          )}

{activeTab === 'layer1' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <DeviceStatus status={deviceStatus} lastSeen={lastSeen} />
                <span className="text-xs text-text-secondary">
                  Capture: {deviceStatus === 'connected' ? 'Active' : 'Inactive'}
                </span>
              </div>
              {['active', 'processing'].includes(status) && (
                <div className="p-4 bg-surface-secondary rounded-md border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Capture Agent</p>
                    {agentCmd ? (
                      <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(`python agent.py --session-id ${agentCmd.session_id} --token "${agentCmd.agent_token}"`)}>
                        Salin Ulang
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleIssueAgentToken} loading={actionLoading}>
                        Generate Command
                      </Button>
                    )}
                  </div>
                  {agentCmd && (
                    <code className="block p-3 bg-surface rounded-md text-xs text-text-primary break-all select-all">
                      python agent.py --session-id {agentCmd.session_id} --token "{agentCmd.agent_token}"
                    </code>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <LiveScreen wsUrl={wsUrl} />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text-primary">Temuan Layer 1</h3>
                    <span className="text-xs text-text-secondary">{visualFindings.length} temuan</span>
                  </div>
                  {visualFindings.length === 0 ? (
                    <p className="text-sm text-text-secondary">Belum ada temuan</p>
                  ) : (
                    <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                      {visualFindings.map(f => <FindingCard key={f.id} finding={f} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layer2' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" onClick={handleReprocess} loading={reprocessing}>
                  <RefreshCw size={14} className="mr-1" /> Analisis Ulang
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-text-primary mb-3">Aktivitas Masuk</h3>
                  {activities.length === 0 ? (
                    <p className="text-sm text-text-secondary">Belum ada data aktivitas. Upload via halaman consent karyawan.</p>
                  ) : (
                    <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                      {activities.map(a => (
                        <div key={a.id} className="p-3 bg-surface-secondary rounded-md border border-border text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-text-primary">{a.activity_type}</span>
                            <span className="text-text-secondary">{a.occurred_at ? new Date(a.occurred_at).toLocaleString('id-ID') : ''}</span>
                          </div>
                          <p className="text-text-secondary truncate">
                            {a.activity_data?.title || a.activity_data?.header || JSON.stringify(a.activity_data).slice(0, 120)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text-primary">Temuan Layer 2</h3>
                    <span className="text-xs text-text-secondary">{logFindings.length} temuan</span>
                  </div>
                  {logFindings.length === 0 ? (
                    <p className="text-sm text-text-secondary">Belum ada temuan</p>
                  ) : (
                    <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                      {logFindings.map(f => <FindingCard key={f.id} finding={f} />)}
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
                breakdown={{ visual: riskScore.calculation_data?.visual_weight ?? riskScore.visual_score, log: riskScore.calculation_data?.log_weight ?? riskScore.log_score }}
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
