import { STATUS_COLORS, STATUS_LABEL, type CRMBookingStatus } from '@/lib/crm-status';

export default function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const s = status as CRMBookingStatus;
  const color = STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-600';
  const label = STATUS_LABEL[s] ?? status;
  return (
    <span className={`crm-status-badge inline-flex items-center whitespace-nowrap px-2.5 py-1 ${color} ${className}`}>
      {label}
    </span>
  );
}
