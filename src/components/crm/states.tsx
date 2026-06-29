import { Inbox } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-[#D6EAEA] border-t-[#205251] ${className}`}
      aria-hidden
    />
  );
}

export function LoadingBlock({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-[#4d6060]">
      <Spinner className="h-8 w-8" />
      <p className="text-sm font-medium text-[#8EBFBF]">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-500 text-2xl font-bold">!</span>
      <div>
        <p className="font-medium text-red-700">Terjadi kesalahan</p>
        <p className="mt-1 text-sm text-red-600">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
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
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#8EBFBF] bg-white px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]">
        <Inbox size={26} aria-hidden />
      </span>
      <div>
        <p className="font-display text-base font-semibold text-[#205251]">{title}</p>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-[#4d6060]">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
