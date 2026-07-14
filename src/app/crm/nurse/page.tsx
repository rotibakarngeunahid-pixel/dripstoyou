'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { crmGet } from '@/lib/crm-client';
import { formatDate, formatMonthYear } from '@/lib/crm-format';
import { STATUS_RANK, type CRMBookingStatus } from '@/lib/crm-status';
import StatusBadge from '@/components/crm/StatusBadge';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';
import { useCRMStaff } from '../CRMShell';
import { Stethoscope, CheckCircle2, ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const monthOf = (isoDate: string) => isoDate.slice(0, 7);

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, (m - 1) + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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
  const [month, setMonth] = useState(monthOf(today()));
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

  const selectDate = useCallback((d: string) => {
    setDate(d);
    setMonth(monthOf(d));
  }, []);

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
          onChange={(e) => selectDate(e.target.value)}
          className="h-11 rounded-2xl border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#0f172a] shadow-sm outline-none focus:border-[#205251] focus:ring-2 focus:ring-[#205251]/10"
        />
      </div>

      {/* Calendar: at-a-glance view of every date this nurse is assigned to */}
      <NurseCalendar
        month={month}
        onMonthChange={setMonth}
        selectedDate={date}
        onSelectDate={selectDate}
      />

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

/* ── Calendar: every date this month the nurse is assigned to, at a glance ── */
type CalendarDay = { booking_date: string; total: number | string; done: number | string; cancelled: number | string };

function NurseCalendar({
  month, onMonthChange, selectedDate, onSelectDate,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await crmGet<{ items: CalendarDay[] }>(`/api/crm/nurse?portal=1&calendar=1&month=${month}`);
      setDays(d.items ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat kalender'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const byDate = new Map(days.map((d) => [d.booking_date.slice(0, 10), d]));
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const leadingBlanks = (new Date(year, mon - 1, 1).getDay() + 6) % 7; // Monday-first offset
  const assignedDays = days.length;
  const totalBookings = days.reduce((sum, d) => sum + Number(d.total), 0);

  return (
    <div className="crm-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-[#205251]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">Kalender Tugas</p>
            <p className="mt-0.5 text-sm text-[#64748b]">
              {assignedDays > 0 ? `${assignedDays} hari · ${totalBookings} booking bulan ini` : 'Belum ada jadwal bulan ini'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            aria-label="Bulan sebelumnya"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#205251] transition hover:bg-[#D6EAEA]/50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[8.5rem] text-center text-sm font-semibold text-[#0f172a]">{formatMonthYear(month)}</span>
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            aria-label="Bulan berikutnya"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#205251] transition hover:bg-[#D6EAEA]/50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {error ? <ErrorBlock message={error} onRetry={load} /> : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`blank-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const iso = `${year}-${String(mon).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const info = byDate.get(iso);
              const total = info ? Number(info.total) : 0;
              const done = info ? Number(info.done) : 0;
              const assigned = total > 0;
              const allDone = assigned && done >= total;
              const isSelected = iso === selectedDate;
              const isToday = iso === today();
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onSelectDate(iso)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                    isSelected
                      ? 'bg-[#205251] font-bold text-white'
                      : allDone
                      ? 'bg-[#d1fae5] font-semibold text-[#10b981]'
                      : assigned
                      ? 'bg-[#D6EAEA] font-semibold text-[#205251]'
                      : 'text-[#64748b] hover:bg-[#f1f5f9]'
                  } ${isToday && !isSelected ? 'ring-2 ring-inset ring-[#C9944C]' : ''}`}
                >
                  {dayNum}
                  {assigned && (
                    <span className={`mt-0.5 text-[9px] font-bold leading-none ${
                      isSelected ? 'text-white/80' : allDone ? 'text-[#10b981]' : 'text-[#205251]'
                    }`}>
                      {total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
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
