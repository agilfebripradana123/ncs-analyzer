import { useEffect, useState } from 'react'

function compute(session) {
  if (!session) return 'not_started'
  const agentStatus = session.agent_status
  const lastSeenAt = session.last_seen_at
  if (!agentStatus || agentStatus === 'disconnected') return lastSeenAt ? 'disconnected' : 'not_started'
  if (agentStatus === 'connected') {
    if (!lastSeenAt) return 'connecting'
    return Date.now() - new Date(lastSeenAt).getTime() > 120000 ? 'disconnected' : 'connected'
  }
  if (agentStatus === 'connecting') return 'connecting'
  return 'not_started'
}

export function useDeviceStatus(session) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])
  void tick
  return { status: compute(session), lastSeen: session?.last_seen_at ?? null }
}
