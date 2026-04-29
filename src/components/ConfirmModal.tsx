import '../styles/Modal.css';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{message}</p>
          <div className="confirm-actions">
            <button className="confirm-cancel-btn" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              className={`confirm-ok-btn ${destructive ? 'danger' : ''}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
