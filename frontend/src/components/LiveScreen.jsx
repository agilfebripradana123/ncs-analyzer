import { useState } from 'react'
import Card from '../components/Card'

export default function LiveScreen({ streamUrl }) {
  const [error, setError] = useState(false)

  if (error || !streamUrl) {
    return (
      <Card padding={false}>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <span className="text-4xl mb-2">⚪</span>
          <p className="text-sm text-text-primary font-medium">{error ? 'Stream offline' : 'Device Not Connected'}</p>
          <p className="text-xs text-text-secondary mt-1">
            {error ? 'Capture Agent stream tidak tersedia' : 'Connect Android device to start assessment'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding={false}>
      <div className="relative bg-surface-secondary overflow-hidden">
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-critical text-white text-xs px-2 py-0.5 rounded-full">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
        </div>
        <img
          src={streamUrl}
          alt="Live Android Screen"
          onError={() => setError(true)}
          className="w-full h-auto object-contain max-h-[32rem]"
        />
      </div>
    </Card>
  )
}
