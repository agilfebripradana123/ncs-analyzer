import { useEffect, useRef, useState } from 'react'
import Card from './Card'

export default function LiveScreen({ wsUrl }) {
  const canvasRef = useRef(null)
  const [status, setStatus] = useState(wsUrl ? 'connecting' : 'offline')

  useEffect(() => {
    if (!wsUrl) {
      setStatus('offline')
      return
    }

    let ws = null
    let decoder = null
    let stopping = false
    let reconnectTimer = null
    let configTimeout = null
    let needKey = true

    const cleanupDecoder = () => {
      try { if (decoder && decoder.state !== 'closed') decoder.close() } catch {}
      decoder = null
    }

    const scheduleReconnect = (delay = 1200) => {
      if (stopping) return
      cleanupDecoder()
      if (configTimeout) clearTimeout(configTimeout)
      setStatus('connecting')
      reconnectTimer = setTimeout(() => { if (!stopping) init() }, delay)
    }

    const init = () => {
      needKey = true

      try {
        decoder = new VideoDecoder({
          output: (frame) => {
            const canvas = canvasRef.current
            if (canvas) {
              canvas.width = frame.displayWidth
              canvas.height = frame.displayHeight
              canvas.getContext('2d').drawImage(frame, 0, 0)
            }
            frame.close()
            if (!stopping) setStatus('connected')
          },
          error: () => {
            // decoder error -> reconfigure on next keyframe; if unconfigured, reconnect
            if (!stopping && decoder?.state === 'closed') scheduleReconnect(800)
          },
        })
      } catch {
        scheduleReconnect(1500)
        return
      }

      ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'

      configTimeout = setTimeout(() => {
        if (!stopping && decoder && decoder.state === 'unconfigured') {
          try { ws.close() } catch {}
          scheduleReconnect(500)
        }
      }, 4000)

      ws.onopen = () => {
        if (stopping) { try { ws.close() } catch {} }
      }

      ws.onerror = () => {
        // keep canvas, retry silently — don't flip to error card
      }

      ws.onclose = () => {
        if (configTimeout) clearTimeout(configTimeout)
        if (stopping) return
        scheduleReconnect(1200)
      }

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'config' && decoder) {
              if (configTimeout) clearTimeout(configTimeout)
              const desc = Uint8Array.from(atob(msg.desc), (c) => c.charCodeAt(0))
              try {
                decoder.configure({ codec: msg.codec, description: desc, optimizeForLatency: true })
              } catch {
                // reconfigure not allowed on this decoder — rebuild once
                try { decoder.close() } catch {}
                decoder = new VideoDecoder({
                  output: (frame) => {
                    const c = canvasRef.current
                    if (c) { c.width = frame.displayWidth; c.height = frame.displayHeight; c.getContext('2d').drawImage(frame, 0, 0) }
                    frame.close()
                    if (!stopping) setStatus('connected')
                  },
                  error: () => {},
                })
                decoder.configure({ codec: msg.codec, description: desc, optimizeForLatency: true })
              }
              needKey = true
            }
          } catch {}
          return
        }
        const buf = new Uint8Array(event.data)
        if (buf.length < 5 || !decoder || decoder.state !== 'configured') return
        const isKey = buf[0] === 1
        if (needKey && !isKey) return
        try {
          decoder.decode(new EncodedVideoChunk({ type: isKey ? 'key' : 'delta', timestamp: performance.now() * 1000, data: buf.subarray(1) }))
          needKey = false
        } catch {}
      }
    }

    init()

    return () => {
      stopping = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (configTimeout) clearTimeout(configTimeout)
      try { if (ws && ws.readyState !== WebSocket.CLOSED) ws.close(1000) } catch {}
      cleanupDecoder()
    }
  }, [wsUrl])

  if (!wsUrl) {
    return (
      <Card padding={false}>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <span className="text-4xl mb-2">⚪</span>
          <p className="text-sm text-text-primary font-medium">Device Not Connected</p>
          <p className="text-xs text-text-secondary mt-1">Jalankan agent untuk memulai preview</p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding={false}>
      <div className="relative bg-surface-secondary overflow-hidden min-h-[18rem] flex items-center justify-center">
        {status === 'connected' && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-critical text-white text-xs px-2 py-0.5 rounded-full">
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
          </div>
        )}
        {status === 'connecting' && (
          <div className="absolute top-2 left-2 z-10 bg-warning text-text-primary text-xs px-2 py-0.5 rounded-full">Connecting...</div>
        )}
        <canvas ref={canvasRef} className="w-full h-auto object-contain max-h-[32rem] bg-surface-secondary" />
      </div>
    </Card>
  )
}
