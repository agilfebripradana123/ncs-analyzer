export default function Input({ label, error, helper, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <input
        className={`px-3 py-2 text-sm border rounded-md bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface-secondary disabled:text-text-secondary ${
          error ? 'border-critical' : 'border-border'
        }`}
        {...props}
      />
      {helper && !error && (
        <span className="text-xs text-text-secondary">{helper}</span>
      )}
      {error && <span className="text-xs text-critical">{error}</span>}
    </div>
  )
}