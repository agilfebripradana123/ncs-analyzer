import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import LoadingState from './LoadingState'
import Pagination from './Pagination'

export default function DataTable({
  columns,
  data,
  loading,
  error,
  onRetry,
  emptyMessage,
  emptyAction,
  meta,
  onPageChange,
  rowKey = 'id',
  actions,
  onRowClick,
}) {
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (!data || data.length === 0) {
    return (
      <EmptyState
        message={emptyMessage || 'Tidak ada data'}
        action={emptyAction}
      />
    )
  }

  return (
    <>
      <div className="bg-surface border border-border rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-full">
            <thead className="bg-surface-secondary border-b border-border">
              <tr>
                {columns.map((col) => (
                   <th
                    key={col.key}
                    className="px-3 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider"
                   >
                    {col.header}
                  </th>
                ))}
                {actions && (
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => (
                <tr
                  key={row[rowKey]}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-primary/5 transition-colors${onRowClick ? ' cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-primary">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {meta && <Pagination meta={meta} onPageChange={onPageChange} />}
    </>
  )
}
