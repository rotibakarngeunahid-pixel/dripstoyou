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
      <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Tutup" onClick={onClose} />
      <div className="relative z-10 flex w-full flex-col bg-white sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F0E7] px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-[#205251]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F0E7] text-[#4d6060] transition hover:bg-[#D6EAEA] hover:text-[#205251]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-[#F3F0E7] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
