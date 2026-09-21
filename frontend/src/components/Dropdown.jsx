import { useRef, useEffect, useState } from 'react'

export default function Dropdown({ trigger, items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}>{trigger}</button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-md shadow-sm py-1 z-20">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-secondary transition-colors ${
                item.danger ? 'text-critical' : 'text-text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
