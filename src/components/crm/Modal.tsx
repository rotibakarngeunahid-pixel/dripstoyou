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
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-4">
      <button className="absolute inset-0 bg-black/40" aria-label="Tutup" onClick={onClose} />
      <div className="relative z-10 flex w-full flex-col bg-white sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#DBDAD7] px-5 py-4">
          <h2 className="font-display text-lg text-[#205251]">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 text-[#4d6060] hover:bg-[#F3F0E7]">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-[#DBDAD7] px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
