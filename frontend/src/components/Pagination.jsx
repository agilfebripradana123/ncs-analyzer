import Button from './Button'

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  const pages = []
  const current = meta.current_page
  const last = meta.last_page

  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', last)
    } else if (current >= last - 2) {
      pages.push(1, '...', last - 3, last - 2, last - 1, last)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', last)
    }
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-text-secondary">
        Menampilkan {meta.from || 0} sampai {meta.to || 0} dari {meta.total} hasil
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        >
          Sebelumnya
        </Button>
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-text-secondary">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                page === current
                  ? 'bg-primary text-white'
                  : 'text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {page}
            </button>
          ),
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={current === last}
          onClick={() => onPageChange(current + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  )
}
