import Badge from './Badge'

const VARIANTS = {
  pending: 'default',
  consent: 'blue',
  active: 'blue',
  processing: 'blue',
  completed: 'success',
  cancelled: 'default',
  expired: 'danger',
}

const LABELS = {
  pending: 'Pending',
  consent: 'Consent',
  active: 'Active',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

export default function StatusBadge({ status }) {
  return <Badge variant={VARIANTS[status] || 'default'}>{LABELS[status] || status}</Badge>
}