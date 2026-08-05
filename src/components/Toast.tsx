import { useEffect } from 'react';

export type ToastKind = 'success' | 'error';

interface ToastProps {
  message: string;
  kind?: ToastKind;
  onClose: () => void;
  durationMs?: number;
}

export default function Toast({
  message,
  kind = 'success',
  onClose,
  durationMs = 4000,
}: ToastProps) {
  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, message, onClose]);

  return (
    <div className={`toast toast-${kind}`} role="alert" aria-live="assertive">
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        aria-label="关闭通知"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
