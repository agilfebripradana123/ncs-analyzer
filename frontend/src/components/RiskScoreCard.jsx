import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Badge from './Badge'

export default function RiskScoreCard({ score = 68, level = 'HIGH', breakdown }) {
  const data = breakdown
    ? [
        { name: 'Visual', value: breakdown.visual },
        { name: 'Log', value: breakdown.log },
      ]
    : []

  return (
    <div className="bg-surface border border-border rounded-md shadow-sm p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Skor Risiko</h3>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-4xl font-bold text-text-primary">{score}</span>
        <span className="text-lg text-text-secondary mb-1">/100</span>
      </div>
      <Badge variant={level === 'HIGH' || level === 'CRITICAL' ? 'high' : 'warning'}>
        {level}
      </Badge>
      {breakdown && (
        <>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-text-secondary">Skor Visual</span>
            <span className="font-medium text-text-primary">{breakdown.visual}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-text-secondary">Skor Log</span>
            <span className="font-medium text-text-primary">{breakdown.log}</span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
