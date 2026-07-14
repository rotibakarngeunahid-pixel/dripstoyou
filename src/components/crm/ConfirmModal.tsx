'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Tutup"
        onClick={onCancel}
        disabled={loading}
      />
      <div role="dialog" aria-modal="true" aria-labelledby="crm-confirm-title" className="relative z-10 w-full max-w-sm rounded-lg border border-[#dce5ea] bg-white p-6 shadow-2xl">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-[#D6EAEA] text-[#205251]'}`}>
          <AlertTriangle size={22} />
        </div>
        <h2 id="crm-confirm-title" className="font-display text-lg font-semibold text-[#174846]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#4d6060]">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-xl border border-[#DBDAD7] px-4 text-sm font-medium text-[#111a1a] transition hover:bg-[#f5f2eb] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition disabled:opacity-70 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#205251] hover:bg-[#174846]'}`}
          >
            {loading ? 'Memproses…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
