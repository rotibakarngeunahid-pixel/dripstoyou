import { Inbox } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#8EBFBF] border-t-[#205251] ${className}`}
      aria-hidden
    />
  );
}

export function LoadingBlock({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#4d6060]">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:brightness-95">
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
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#8EBFBF] bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]">
        <Inbox size={24} aria-hidden />
      </span>
      <div>
        <p className="font-medium text-[#205251]">{title}</p>
        {description && <p className="mt-1 text-sm text-[#4d6060]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
