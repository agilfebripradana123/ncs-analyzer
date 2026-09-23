import Badge from './Badge'

const VARIANTS = {
  pending_consent: 'yellow',
  pending: 'default',
  consent: 'blue',
  consented: 'success',
  in_progress: 'blue',
  active: 'blue',
  processing: 'blue',
  completed: 'success',
  cancelled: 'default',
  expired: 'danger',
}

const LABELS = {
  pending_consent: 'Menunggu Consent',
  pending: 'Menunggu',
  consent: 'Persetujuan',
  consented: 'Consent Disetujui',
  in_progress: 'Berlangsung',
  active: 'Aktif',
  processing: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  expired: 'Kadaluarsa',
}

export default function StatusBadge({ status }) {
  return <Badge variant={VARIANTS[status] || 'default'}>{LABELS[status] || status}</Badge>
}