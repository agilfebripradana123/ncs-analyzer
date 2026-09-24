import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'

const severityVariant = (sev) => {
  switch ((sev || '').toLowerCase()) {
    case 'critical': return 'danger'
    case 'high': return 'high'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'default'
  }
}

const formatDateTime = (iso) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function SeverityBars({ bySeverity = {} }) {
  const order = ['critical', 'high', 'medium', 'low']
  const max = Math.max(1, ...order.map((k) => bySeverity[k] || 0))
  return (
    <div className="space-y-2">
      {order.map((sev) => {
        const count = bySeverity[sev] || 0
        return (
          <div key={sev} className="flex items-center gap-3 text-sm">
            <Badge variant={severityVariant(sev)} className="w-20 justify-center capitalize">{sev}</Badge>
            <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="w-10 text-right font-medium text-text-primary">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function FindingsList({ title, findings = [] }) {
  if (findings.length === 0) return <EmptyState message={`Tidak ada ${title.toLowerCase()}`} />
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-text-primary">{title} ({findings.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findings.map((f) => (
          <div key={f.id} className="bg-surface border border-border rounded-md p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-text-primary">{f.type || '-'}</span>
              <Badge variant={severityVariant(f.severity)}>{(f.severity || '-').toUpperCase()}</Badge>
            </div>
            <p className="text-sm text-text-secondary mb-2">{f.description || '-'}</p>
            <div className="text-xs text-text-secondary space-y-1">
              <div>Rule: {f.rule?.name || '-'}</div>
              <div>Terdeteksi: {formatDateTime(f.detected_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/assessor/assessments/${id}/report`)
      setPayload(data.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setPayload(null)
        setError(null)
      } else {
        setError(err.response?.data?.message || 'Gagal memuat laporan')
        toast.error(err.response?.data?.message || 'Gagal memuat laporan')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await api.post(`/assessor/assessments/${id}/report`)
      toast.success('Laporan berhasil digenerate')
      await fetchReport()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate laporan')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => { fetchReport() }, [id])

  if (loading) return <LoadingState message="Memuat laporan..." />
  if (error) return <EmptyState message={error} action={<Button onClick={fetchReport}>Coba Lagi</Button>} />

  if (!payload) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/assessor/assessments/${id}`)} className="mb-6">
          <ArrowLeft size={16} /> Kembali
        </Button>
        <EmptyState
          message="Belum ada laporan untuk assessment ini"
          action={<Button onClick={handleGenerate} loading={generating}>Generate Laporan</Button>}
        />
      </div>
    )
  }

  const { report, risk_score: riskScore, visual_findings: visual, log_findings: logs } = payload
  const summary = report?.summary || {}

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(`/assessor/assessments/${id}`)} className="mb-6">
        <ArrowLeft size={16} /> Kembali
      </Button>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary">
            Laporan {report?.assessment?.assessment_code || `#${id}`}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {report?.assessment?.employee?.name || '-'} • Digenerate {formatDateTime(report?.generated_at)}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleGenerate} loading={generating}>
          Generate Ulang
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Skor Risiko</p>
          <p className="text-2xl font-bold text-text-primary">{riskScore?.score ?? '-'}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Level Risiko</p>
          <p className="mt-1">
            <Badge variant={severityVariant(riskScore?.level)}>{(riskScore?.level || '-').toUpperCase()}</Badge>
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Total Temuan</p>
          <p className="text-2xl font-bold text-text-primary">{report?.total_findings ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Visual / Log</p>
          <p className="text-2xl font-bold text-text-primary">
            {summary.visual_findings_count ?? 0} <span className="text-sm font-normal text-text-secondary">/ {summary.log_findings_count ?? 0}</span>
          </p>
        </Card>
      </div>

      <Card className="mb-4 md:mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Breakdown Severity</h3>
        <SeverityBars bySeverity={summary.by_severity} />
      </Card>

      <div className="space-y-4 md:space-y-6">
        <FindingsList title="Visual Findings" findings={visual} />
        <FindingsList title="Log Findings" findings={logs} />
      </div>
    </div>
  )
}
