import Button from './Button'
import { isValidElement } from 'react'

export default function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <p className="text-sm text-text-secondary mb-4">{message || 'Tidak ada data'}</p>
      {action && (
        isValidElement(action) ? action : (
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
