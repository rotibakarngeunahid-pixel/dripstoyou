import { AlertCircle, Inbox } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-[#D6EAEA] border-t-[#205251] ${className}`}
      aria-hidden
    />
  );
}

export function LoadingBlock({ label = 'Memuat...' }: { label?: string }) {
  return (
    <div className="crm-card flex min-h-[220px] flex-col items-center justify-center gap-4 text-center text-[#60727a]">
      <Spinner className="h-8 w-8" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-red-100 bg-red-50 px-6 py-14 text-center shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
        <AlertCircle size={24} aria-hidden />
      </span>
      <div>
        <p className="font-medium text-red-700">Terjadi kesalahan</p>
        <p className="mt-1 text-sm text-red-600">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="crm-empty-state flex flex-col items-center gap-4">
      <span className="crm-empty-icon">
        <Inbox size={26} aria-hidden />
      </span>
      <div>
        <p className="font-display text-lg font-semibold text-[#174846]">{title}</p>
        {description && <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[#60727a]">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
