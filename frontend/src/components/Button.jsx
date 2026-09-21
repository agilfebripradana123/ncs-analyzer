import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/20'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }
  const variants = {
    primary: 'bg-primary border-primary text-white hover:bg-primary-dark',
    secondary:
      'bg-surface-secondary border-border text-text-primary hover:bg-surface',
    danger: 'bg-critical border-critical text-white hover:bg-critical/90',
    ghost: 'bg-transparent border-transparent text-text-primary hover:bg-surface',
  }
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}