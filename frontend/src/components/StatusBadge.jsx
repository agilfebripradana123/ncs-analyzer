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
  pending: 'Menunggu',
  consent: 'Persetujuan',
  active: 'Aktif',
  processing: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  expired: 'Kadaluarsa',
}

export default function StatusBadge({ status }) {
  return <Badge variant={VARIANTS[status] || 'default'}>{LABELS[status] || status}</Badge>
}