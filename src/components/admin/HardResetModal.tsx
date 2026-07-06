'use client';

import { useEffect } from 'react';

export const HARD_RESET_CONFIRMATION_PHRASE = 'HAPUS DATA TERPILIH';

type SelectedCategory = { key: string; label: string; count: number };

type Props = {
  open: boolean;
  categories: SelectedCategory[];
  loading: boolean;
  error: string;
  reason: string;
  confirmText: string;
  onReasonChange: (r: string) => void;
  onConfirmTextChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  t: Record<string, string>;
};

export function HardResetModal({
  open, categories, loading, error, reason, confirmText,
  onReasonChange, onConfirmTextChange, onConfirm, onCancel, t,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const canConfirm = reason.trim().length >= 5 && confirmText === HARD_RESET_CONFIRMATION_PHRASE && !loading;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hard-reset-title"
        style={{
          background: 'white', borderRadius: 20, padding: 32,
          maxWidth: 520, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.24)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <h3
          id="hard-reset-title"
          style={{
            fontFamily: 'var(--font-playfair,Georgia,serif)',
            color: '#dc2626', fontSize: 20, marginBottom: 16, fontWeight: 700,
          }}
        >
          {t.resetDataModalTitle}
        </h3>

        <div style={{
          background: '#fafafa', border: '1px solid #f0f0f0',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          fontSize: 13, lineHeight: 1.8,
        }}>
          <span style={{ color: '#888' }}>{t.resetDataModalSummary}</span>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {categories.map((c) => (
              <li key={c.key}>
                <strong style={{ color: 'var(--teal)' }}>{c.label}</strong> — {c.count} {t.resetDataItemCount}
              </li>
            ))}
          </ul>
        </div>

        <div style={{
          color: '#dc2626', fontSize: 13, fontWeight: 600,
          marginBottom: 16, lineHeight: 1.5,
        }}>
          ⚠️ {t.resetTransaksiWarning}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="hard-reset-reason"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#333' }}
          >
            {t.alasanReset} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            id="hard-reset-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t.alasanResetPlaceholder}
            rows={3}
            disabled={loading}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid #e2e2e2', fontSize: 13, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
              outline: 'none', transition: 'border-color 0.15s',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="hard-reset-confirm-text"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#333' }}
          >
            {t.konfirmasiTeksLabel}{' '}
            <code style={{
              background: '#fef2f2', color: '#dc2626', padding: '2px 6px',
              borderRadius: 6, fontWeight: 700, fontSize: 12,
            }}>
              {HARD_RESET_CONFIRMATION_PHRASE}
            </code>
          </label>
          <input
            id="hard-reset-confirm-text"
            type="text"
            value={confirmText}
            onChange={(e) => onConfirmTextChange(e.target.value)}
            placeholder={HARD_RESET_CONFIRMATION_PHRASE}
            disabled={loading}
            autoComplete="off"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid #e2e2e2', fontSize: 13,
              fontFamily: 'monospace', boxSizing: 'border-box',
              outline: 'none', transition: 'border-color 0.15s',
            }}
          />
        </div>

        {error && (
          <div style={{
            color: '#dc2626', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: 8,
            padding: '8px 12px', marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="button button-secondary"
            style={{ minHeight: 40, padding: '8px 18px', fontSize: 13 }}
            onClick={onCancel}
            disabled={loading}
          >
            {t.batal}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              minHeight: 40, padding: '8px 22px', fontSize: 13, fontWeight: 600,
              background: canConfirm ? '#dc2626' : '#f87171',
              color: 'white', border: 'none', borderRadius: 10,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              opacity: canConfirm ? 1 : 0.65,
              transition: 'background 0.15s, opacity 0.15s',
            }}
          >
            {loading ? t.sedangMereset : t.resetDataConfirmButton}
          </button>
        </div>
      </div>
    </div>
  );
}
