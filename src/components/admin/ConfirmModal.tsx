'use client';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loadingLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  loadingLabel = 'Memproses...',
  danger,
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        style={{
          background: 'white',
          borderRadius: 20,
          padding: 32,
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
      >
        <h3
          id="admin-confirm-title"
          style={{
            fontFamily: 'var(--font-playfair,Georgia,serif)',
            color: 'var(--teal)',
            fontSize: 20,
            marginBottom: 10,
          }}
        >
          {title}
        </h3>
        <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className="button button-secondary"
            style={{ minHeight: 40, padding: '8px 18px', fontSize: 13 }}
            onClick={onCancel}
            type="button"
            disabled={loading}
          >
            Batal
          </button>
          <button
            className={`button${loading ? ' loading' : ''}`}
            style={{
              minHeight: 40,
              padding: '8px 18px',
              fontSize: 13,
              background: danger ? '#dc2626' : 'var(--teal)',
              color: 'white',
              border: 'none',
              opacity: loading ? 0.75 : 1,
            }}
            onClick={onConfirm}
            type="button"
            disabled={loading}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
