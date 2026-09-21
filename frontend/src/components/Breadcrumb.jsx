import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-4 flex-wrap">
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {item.to && !last ? (
              <Link to={item.to} className="text-primary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={`font-semibold ${last ? 'text-text' : 'text-text-muted'}`}>
                {item.label}
              </span>
            )}
            {!last && <ChevronRight size={14} className="text-text-muted" />}
          </span>
        )
      })}
    </nav>
  )
}