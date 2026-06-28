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
    <div className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8EBFBF]">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}1a`, color: accent }}>
            <Icon size={16} aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl" style={{ color: accent }}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[#4d6060]">{hint}</p>}
    </div>
  );
}
