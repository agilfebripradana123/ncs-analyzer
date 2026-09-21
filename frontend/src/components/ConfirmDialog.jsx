import Button from './Button'
import Modal from './Modal'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  danger = true,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Konfirmasi'} size="sm">
      <p className="text-sm text-text-secondary">
        {message || 'Yakin ingin melanjutkan?'}
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
