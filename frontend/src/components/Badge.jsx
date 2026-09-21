export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface-secondary text-text-secondary border border-border',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-critical/10 text-critical',
    high: 'bg-high-risk/10 text-high-risk',
    blue: 'bg-primary/10 text-primary',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}