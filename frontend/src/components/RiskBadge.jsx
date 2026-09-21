import Badge from './Badge'

const VARIANTS = {
  low: 'success',
  medium: 'warning',
  high: 'high',
  critical: 'danger',
}

export default function RiskBadge({ level }) {
  const normalized = String(level || '').toLowerCase()
  return <Badge variant={VARIANTS[normalized] || 'default'}>{level}</Badge>
}