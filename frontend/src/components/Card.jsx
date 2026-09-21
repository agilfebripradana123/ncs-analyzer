export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={`bg-surface border border-border rounded-md shadow-sm ${
        padding ? 'p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
