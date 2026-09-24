import { useEffect, useState } from 'react'

const statusConfig = {
  connected: { dot: 'bg-success', label: 'Connected', badge: 'success' },
  connecting: { dot: 'bg-warning animate-pulse', label: 'Connecting', badge: 'warning' },
  disconnected: { dot: 'bg-critical', label: 'Disconnected', badge: 'danger' },
  not_started: { dot: 'bg-text-secondary', label: 'Not Started', badge: 'default' },
}

export default function DeviceStatus({ status, lastSeen }) {
  const cfg = statusConfig[status] || statusConfig.not_started
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ago = lastSeen ? formatAgo(now - new Date(lastSeen).getTime()) : null

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
      <span className="font-medium text-text-primary">{cfg.label}</span>
      {ago && <span className="text-xs text-text-secondary">• Last heartbeat: {ago} ago</span>}
    </div>
  )
}

function formatAgo(ms) {
  if (ms < 0) ms = 0
  const s = Math.floor(ms / 1000) % 60
  const m = Math.floor(ms / 60000) % 60
  const h = Math.floor(ms / 3600000)
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`
  if (ms >= 86400000) {
    const d = new Date(Date.now() - ms)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}