import type { CSSProperties } from 'react';
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
      className="crm-stat-card transition-all hover:-translate-y-px"
      style={{ '--stat-accent': accent } as CSSProperties}
    >
      <div className="crm-stat-head">
        <div className="min-w-0">
          <p className="crm-stat-label">{label}</p>
          <p className="crm-stat-value">{value}</p>
        </div>
        {Icon && (
          <span className="crm-stat-icon">
            <Icon size={22} aria-hidden />
          </span>
        )}
      </div>
      {hint && <p className="crm-stat-hint">{hint}</p>}
    </div>
  );
}
