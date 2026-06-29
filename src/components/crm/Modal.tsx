'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Tutup" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border border-[#dce5ea] bg-white shadow-2xl sm:max-w-xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-[#eef4f5] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#8a9aa3]">CRM Form</p>
            <h2 className="truncate font-display text-lg font-semibold text-[#174846]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#eef4f5] text-[#60727a] transition hover:bg-[#D6EAEA] hover:text-[#174846]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="border-t border-[#eef4f5] bg-[#f8fafc] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
