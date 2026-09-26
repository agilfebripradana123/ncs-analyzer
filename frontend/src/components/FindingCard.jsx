import Badge from './Badge'

const severityVariant = { critical: 'danger', high: 'danger', medium: 'warning', low: 'blue' }

export default function FindingCard({ finding }) {
  const ev = finding.evidence ?? {}
  const isSimilarity = (ev.matcher ?? '') === 'similarity'
  const conf = isSimilarity ? (ev.confidence ?? null) : null
  const analyzedText = ev.analyzed_text ?? ev.detection?.text ?? ev.detection?.label
  const matchedCorpus = ev.matched_corpus
  const matchedKw = ev.matched_keywords
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
      {matchedKw?.length > 0 && !isSimilarity && (
        <p className="text-xs text-text-secondary mb-2">
          Kata kunci terdeteksi: {matchedKw.map(k => `'${k}'`).join(', ')}
        </p>
      )}
      {analyzedText && (
        <p className="text-xs text-text-secondary bg-background border border-border rounded-md px-3 py-2 mb-2 break-words">
          <span className="text-text-primary font-medium">Teks dianalisis: </span>{analyzedText}
          {matchedCorpus && (
            <span className="block mt-1"><span className="text-text-primary font-medium">Cocok dengan: </span>{matchedCorpus}</span>
          )}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        {conf != null && <><span>Similarity: {(conf * 100).toFixed(0)}%</span><span>•</span></>}
        <span>Terdeteksi: {finding.detected_at ? new Date(finding.detected_at).toLocaleString('id-ID') : '-'}</span>
      </div>
    </div>
  )
}
