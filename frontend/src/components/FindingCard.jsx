import Badge from './Badge'

const severityVariant = { critical: 'danger', high: 'danger', medium: 'warning', low: 'blue' }

export default function FindingCard({ finding }) {
  const conf = finding.evidence?.detection?.confidence
  return (
    <div className="bg-surface border border-border rounded-md shadow-sm p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">
          {finding.type}
        </span>
        <Badge variant={severityVariant[finding.severity] || 'default'}>
          {finding.severity}
        </Badge>
      </div>
      {finding.description && (
        <p className="text-sm text-text-secondary mb-2">{finding.description}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        {conf != null && <><span>Keyakinan: {(conf * 100).toFixed(0)}%</span><span>•</span></>}
        <span>Terdeteksi: {finding.detected_at ? new Date(finding.detected_at).toLocaleString('id-ID') : '-'}</span>
      </div>
    </div>
  )
}
