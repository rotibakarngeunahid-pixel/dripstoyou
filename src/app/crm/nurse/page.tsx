'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { crmGet } from '@/lib/crm-client';
import { formatDate } from '@/lib/crm-format';
import { STATUS_RANK, type CRMBookingStatus } from '@/lib/crm-status';
import StatusBadge from '@/components/crm/StatusBadge';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';
import { useCRMStaff } from '../CRMShell';
import { Stethoscope, CheckCircle2, ChevronRight } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

export default function NursePage() {
  const staff = useCRMStaff();
  const isNurse = staff?.role === 'NURSE';
  return isNurse ? <NursePortal /> : <NurseAdminView />;
}

/* ── Nurse's own daily schedule ─── */
type PortalBooking = {
  id: string; booking_code_display: string | null; booking_time: string; crm_status: CRMBookingStatus;
  customer_name: string; product_name: string; service_area_name: string | null;
};

function nurseCTA(status: CRMBookingStatus, id: string, code: string | null) {
  const rank = STATUS_RANK[status] ?? 0;
  if (rank >= STATUS_RANK.TREATMENT_COMPLETED) return { href: `/crm/booking/${code ?? id}`, label: 'Lihat Detail' };
  if (status === 'CONSENT_SIGNED' || status === 'TREATMENT_IN_PROGRESS') return { href: `/crm/treatment/${id}`, label: 'Lanjut Treatment' };
  if (status === 'SCREENING_COMPLETED') return { href: `/crm/consent/${id}`, label: 'Buka Consent' };
  return { href: `/crm/screening/${id}`, label: 'Mulai Screening' };
}

function NursePortal() {
  const staff = useCRMStaff();
  const [date, setDate] = useState(today());
  const [items, setItems] = useState<PortalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await crmGet<{ items: PortalBooking[] }>(`/api/crm/nurse?portal=1&date=${date}`);
      setItems(d.items ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat jadwal'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const doneCount = items.filter((b) => (STATUS_RANK[b.crm_status] ?? 0) >= STATUS_RANK.TREATMENT_COMPLETED).length;
  const firstName = staff?.name?.split(' ')[0] ?? 'Nurse';

  return (
    <div className="crm-page">
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Halo, {firstName}</h1>
          <p className="crm-page-subtitle">Jadwal kamu hari ini</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-2xl border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#0f172a] shadow-sm outline-none focus:border-[#205251] focus:ring-2 focus:ring-[#205251]/10"
        />
      </div>

      {/* Summary cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Total', value: items.length, color: '#205251', bg: '#D6EAEA' },
            { label: 'Selesai', value: doneCount, color: '#10b981', bg: '#d1fae5' },
            { label: 'Sisa', value: items.length - doneCount, color: '#f59e0b', bg: '#fef3c7' },
          ].map((s) => (
            <div key={s.label} className="crm-card text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : items.length === 0 ? (
        <EmptyState
          title="Tidak ada jadwal"
          description={`Belum ada booking untuk ${formatDate(date)}.`}
        />
      ) : (
        <div className="space-y-3">
          {items.map((b) => {
            const cta = nurseCTA(b.crm_status, b.id, b.booking_code_display);
            const isDone = (STATUS_RANK[b.crm_status] ?? 0) >= STATUS_RANK.TREATMENT_COMPLETED;
            return (
              <div
                key={b.id}
                className={`crm-record-card p-4 transition ${
                  isDone ? 'border-[#d1fae5] opacity-70' : 'border-[#e2e8f0]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      isDone ? 'bg-[#d1fae5] text-[#10b981]' : 'bg-[#D6EAEA] text-[#205251]'
                    }`}>
                      {isDone ? <CheckCircle2 size={20} /> : b.customer_name[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="font-semibold text-[#0f172a]">{b.customer_name}</p>
                      <p className="text-sm text-[#64748b]">{b.product_name} · {b.service_area_name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm font-bold text-[#205251]">{b.booking_time}</span>
                    <StatusBadge status={b.crm_status} />
                  </div>
                </div>
                {!isDone && (
                  <Link
                    href={cta.href}
                    className="crm-button mt-3 flex w-full py-2.5 text-sm"
                  >
                    {cta.label} <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Admin/Owner: nurse roster ── */
type NurseRow = { id: string; name: string; phone_last4: string; is_active: boolean; today_count: number };

function NurseAdminView() {
  const [date, setDate] = useState(today());
  const [items, setItems] = useState<NurseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const d = await crmGet<{ items: NurseRow[] }>(`/api/crm/nurse?date=${date}`); setItems(d.items ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat nurse'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Nurse</h1>
          <p className="crm-page-subtitle">Beban kerja per {formatDate(date)}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-2xl border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#0f172a] shadow-sm outline-none focus:border-[#205251] focus:ring-2 focus:ring-[#205251]/10"
        />
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : items.length === 0 ? (
        <EmptyState title="Belum ada nurse" description="Tambahkan nurse melalui modul Staff & Role." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <div key={n.id} className="crm-record-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#D6EAEA] text-base font-bold text-[#205251]">
                  {n.name[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#0f172a]">{n.name}</p>
                  <p className="text-xs text-[#94a3b8]">···{n.phone_last4}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  n.is_active ? 'bg-[#d1fae5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#94a3b8]'
                }`}>
                  {n.is_active ? 'Aktif' : 'Off'}
                </span>
              </div>
              <div className="flex items-end justify-between border-t border-[#f1f5f9] pt-4">
                <div>
                  <p className="text-xs font-medium text-[#94a3b8]">Booking hari ini</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Stethoscope size={16} className="text-[#205251]" />
                  <span className="font-display text-2xl font-bold text-[#205251]">{n.today_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
