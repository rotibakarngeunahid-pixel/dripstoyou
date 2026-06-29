import type { LucideIcon } from 'lucide-react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = '#205251',
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: string;
  hint?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">
            {label}
          </p>
          <p className="font-display text-3xl font-bold leading-none tracking-tight" style={{ color: accent }}>
            {value}
          </p>
          {hint && <p className="mt-2 text-[11px] font-medium text-[#94a3b8]">{hint}</p>}
        </div>
        {Icon && (
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            <Icon size={22} aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
