import Badge from './Badge'

export default function FindingCard({ finding }) {
  return (
    <div className="bg-surface border border-border rounded-md shadow-sm p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">
          {finding.title || finding.type}
        </span>
        <Badge variant={finding.severity === 'HIGH' ? 'high' : 'danger'}>
          {finding.severity}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
        <span>Confidence: {finding.confidence}%</span>
        <span>•</span>
        <span>Detected: {finding.detectedAt}</span>
      </div>
      <div className="text-sm text-text-secondary space-y-1">
        <div>Type: {finding.type}</div>
        <div>Value: {finding.value}</div>
      </div>
    </div>
  )
}
