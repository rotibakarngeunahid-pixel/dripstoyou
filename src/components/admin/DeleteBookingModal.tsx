'use client';

import { useEffect } from 'react';

export type DeleteModalBooking = {
  id: string;
  booking_code: string;
  customer_name: string;
  product_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
};

type Props = {
  open: boolean;
  booking: DeleteModalBooking | null;
  loading: boolean;
  error: string;
  reason: string;
  onReasonChange: (r: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  t: Record<string, string>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DeleteBookingModal({
  open, booking, loading, error, reason, onReasonChange, onConfirm, onCancel, t,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open || !booking) return null;

  const canConfirm = reason.trim().length > 0 && !loading;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-booking-title"
        style={{
          background: 'white', borderRadius: 20, padding: 32,
          maxWidth: 480, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.24)',
        }}
      >
        <h3
          id="delete-booking-title"
          style={{
            fontFamily: 'var(--font-playfair,Georgia,serif)',
            color: '#dc2626', fontSize: 20, marginBottom: 16, fontWeight: 700,
          }}
        >
          {t.hapusBookingTitle}
        </h3>

        {/* Booking summary */}
        <div style={{
          background: '#fafafa', border: '1px solid #f0f0f0',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          fontSize: 13, lineHeight: 2,
        }}>
          <div>
            <span style={{ color: '#888', minWidth: 80, display: 'inline-block' }}>{t.kode}:</span>
            {' '}
            <span style={{ fontFamily: 'monospace', color: 'var(--teal)', fontWeight: 800 }}>
              {booking.booking_code}
            </span>
          </div>
          <div>
            <span style={{ color: '#888', minWidth: 80, display: 'inline-block' }}>Customer:</span>
            {' '}{booking.customer_name}
          </div>
          <div>
            <span style={{ color: '#888', minWidth: 80, display: 'inline-block' }}>Treatment:</span>
            {' '}{booking.product_name}
          </div>
          <div>
            <span style={{ color: '#888', minWidth: 80, display: 'inline-block' }}>{t.tanggal}:</span>
            {' '}{formatDate(booking.booking_date)} • {booking.booking_time}
          </div>
          <div>
            <span style={{ color: '#888', minWidth: 80, display: 'inline-block' }}>Status:</span>
            {' '}{booking.status}
          </div>
        </div>

        {/* Warning */}
        <div style={{
          color: '#dc2626', fontSize: 13, fontWeight: 600,
          marginBottom: 16, lineHeight: 1.5,
        }}>
          {t.hapusBookingWarning}
        </div>

        {/* Reason textarea */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="delete-reason"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#333' }}
          >
            {t.alasanPenghapusan} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            id="delete-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t.alasanPenghapusanPlaceholder}
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

        {/* Inline error */}
        {error && (
          <div style={{
            color: '#dc2626', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: 8,
            padding: '8px 12px', marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Action buttons */}
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
            {loading ? t.sedangMenghapusBooking : t.yaHapusData}
          </button>
        </div>
      </div>
    </div>
  );
}
