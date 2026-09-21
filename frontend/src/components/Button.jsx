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
    primary: 'bg-[#2563EB] border-[#2563EB] text-white hover:bg-[#1D4ED8]',
    secondary:
      'bg-[#F5F7FB] border-[#E2E8F0] text-[#172033] hover:bg-white',
    danger: 'bg-[#DC2626] border-[#DC2626] text-white hover:bg-red-700',
    ghost: 'bg-transparent border-transparent text-[#172033] hover:bg-[#F5F7FB]',
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