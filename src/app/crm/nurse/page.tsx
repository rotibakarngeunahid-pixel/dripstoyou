'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { crmGet } from '@/lib/crm-client';
import { formatDate, formatDateTimeWITA, formatMonthYear } from '@/lib/crm-format';
import { crmBookingHref } from '@/lib/crm-permissions';
import { STATUS_RANK, type CRMBookingStatus } from '@/lib/crm-status';
import StatusBadge from '@/components/crm/StatusBadge';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';
import { useCRMStaff } from '../CRMShell';
import { Stethoscope, CheckCircle2, ChevronRight, ChevronLeft, CalendarDays, Lock, UserX } from 'lucide-react';

// Tanggal lokal perangkat (bukan UTC) — nurse di Bali jam 00:00–08:00 WITA
// masih "kemarin" menurut toISOString(), jadi jangan pakai itu.
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const monthOf = (isoDate: string) => isoDate.slice(0, 7);

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, (m - 1) + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Cermin gate di php-api (crmFormOpenEpoch): form screening/consent/treatment
// terbuka 30 menit sebelum jam booking. Ini hanya soft-lock UI — PHP tetap
// jadi trust boundary.
const FORM_OPEN_EARLY_MIN = 30;
function formOpenAt(dateIso: string, time: string | null | undefined): Date {
  const t = time && /^\d{1,2}:\d{2}/.test(time) ? time.slice(0, 5) : '00:00';
  return new Date(new Date(`${dateIso}T${t.padStart(5, '0')}:00`).getTime() - FORM_OPEN_EARLY_MIN * 60_000);
}

export default function NursePage() {
  const staff = useCRMStaff();
  const isNurse = staff?.role === 'NURSE';
  return isNurse ? <NursePortal /> : <NurseAdminView />;
}

/* ── Shared month calendar grid ─── */
type DayInfo = { count: number; allDone?: boolean; warn?: boolean };
type LegendItem = { swatch: string; label: string };

function MonthCalendar({
  month, onMonthChange, selectedDate, onSelectDate, days, subtitle, legend, loading, error, onRetry,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  days: Map<string, DayInfo>;
  subtitle: string;
  legend: LegendItem[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const leadingBlanks = (new Date(year, mon - 1, 1).getDay() + 6) % 7; // Monday-first offset

  return (
    <div className="crm-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-[#205251]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">Kalender Jadwal</p>
            <p className="mt-0.5 text-sm text-[#64748b]">{subtitle}</p>
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

      {error ? <ErrorBlock message={error} onRetry={onRetry} /> : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`blank-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const iso = `${year}-${String(mon).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const info = days.get(iso);
              const isSelected = iso === selectedDate;
              const isToday = iso === today();
              const cellClass = isSelected
                ? 'bg-[#205251] font-bold text-white'
                : info?.allDone
                ? 'bg-[#d1fae5] font-semibold text-[#10b981]'
                : info?.warn
                ? 'bg-[#fef3c7] font-semibold text-[#b45309]'
                : info
                ? 'bg-[#D6EAEA] font-semibold text-[#205251]'
                : 'text-[#64748b] hover:bg-[#f1f5f9]';
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onSelectDate(iso)}
                  title={info ? `${formatDate(iso)} — ${info.count} booking` : formatDate(iso)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${cellClass} ${
                    isToday && !isSelected ? 'ring-2 ring-inset ring-[#C9944C]' : ''
                  }`}
                >
                  {dayNum}
                  {info && (
                    <span className={`mt-0.5 text-[9px] font-bold leading-none ${
                      isSelected ? 'text-white/80' : info.allDone ? 'text-[#10b981]' : info.warn ? 'text-[#b45309]' : 'text-[#205251]'
                    }`}>
                      {info.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[#f1f5f9] pt-3">
            {legend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] text-[#64748b]">
                <span className={`h-3 w-3 flex-shrink-0 rounded ${l.swatch}`} /> {l.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
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

type CalendarDay = { booking_date: string; total: number | string; done: number | string; cancelled: number | string };

function NursePortal() {
  const staff = useCRMStaff();
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(monthOf(today()));
  const [items, setItems] = useState<PortalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Kalender bulan berjalan (tanggal-tanggal yang punya jadwal).
  const [calDays, setCalDays] = useState<CalendarDay[]>([]);
  const [calLoading, setCalLoading] = useState(true);
  const [calError, setCalError] = useState('');

  // Jam saat ini (di-refresh berkala) supaya tombol form otomatis terbuka
  // begitu waktunya tiba. 0 = belum diketahui (render pertama).
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    const iv = setInterval(() => setNow(Date.now()), 30_000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await crmGet<{ items: PortalBooking[] }>(`/api/crm/nurse?portal=1&date=${date}`);
      setItems(d.items ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat jadwal'); }
    finally { setLoading(false); }
  }, [date]);

  const loadCalendar = useCallback(async () => {
    setCalLoading(true); setCalError('');
    try {
      const d = await crmGet<{ items: CalendarDay[] }>(`/api/crm/nurse?portal=1&calendar=1&month=${month}`);
      setCalDays(d.items ?? []);
    } catch (e) { setCalError(e instanceof Error ? e.message : 'Gagal memuat kalender'); }
    finally { setCalLoading(false); }
  }, [month]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { void loadCalendar(); }, 0);
    return () => clearTimeout(t);
  }, [loadCalendar]);

  const selectDate = useCallback((d: string) => {
    setDate(d);
    setMonth(monthOf(d));
  }, []);

  const dayInfo = useMemo(() => {
    const m = new Map<string, DayInfo>();
    for (const d of calDays) {
      const total = Number(d.total);
      const done = Number(d.done) + Number(d.cancelled);
      m.set(d.booking_date.slice(0, 10), { count: total, allDone: total > 0 && done >= total });
    }
    return m;
  }, [calDays]);

  const assignedDays = calDays.length;
  const totalBookings = calDays.reduce((sum, d) => sum + Number(d.total), 0);
  const doneCount = items.filter((b) => (STATUS_RANK[b.crm_status] ?? 0) >= STATUS_RANK.TREATMENT_COMPLETED).length;
  const firstName = staff?.name?.split(' ')[0] ?? 'Nurse';

  return (
    <div className="crm-page">
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Halo, {firstName}</h1>
          <p className="crm-page-subtitle">Pilih tanggal di kalender untuk melihat detail jadwalmu</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => selectDate(e.target.value)}
          className="h-11 rounded-2xl border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#0f172a] shadow-sm outline-none focus:border-[#205251] focus:ring-2 focus:ring-[#205251]/10"
        />
      </div>

      {/* Calendar: at-a-glance view of every date this nurse is assigned to */}
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        selectedDate={date}
        onSelectDate={selectDate}
        days={dayInfo}
        subtitle={assignedDays > 0 ? `Kamu bertugas ${assignedDays} hari · ${totalBookings} booking bulan ini` : 'Belum ada jadwal bulan ini'}
        legend={[
          { swatch: 'bg-[#D6EAEA]', label: 'Ada jadwal (angka = jumlah booking)' },
          { swatch: 'bg-[#d1fae5]', label: 'Semua selesai' },
          { swatch: 'border-2 border-[#C9944C] bg-white', label: 'Hari ini' },
          { swatch: 'bg-[#205251]', label: 'Tanggal dipilih' },
        ]}
        loading={calLoading}
        error={calError}
        onRetry={loadCalendar}
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

      <div className="flex items-center justify-between">
        <h2 className="crm-section-title">Jadwal {formatDate(date)}</h2>
        {!loading && !error && <span className="text-xs font-medium text-[#94a3b8]">{items.length} booking</span>}
      </div>

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
            const openAt = formOpenAt(date, b.booking_time);
            const locked = !isDone && now !== 0 && now < openAt.getTime();
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
                {!isDone && (locked ? (
                  <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f1f5f9] py-2.5 text-sm font-medium text-[#94a3b8]">
                    <Lock size={14} /> Form terbuka {formatDateTimeWITA(openAt)}
                  </div>
                ) : (
                  <Link
                    href={cta.href}
                    className="crm-button mt-3 flex w-full py-2.5 text-sm"
                  >
                    {cta.label} <ChevronRight size={16} />
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Admin/Owner: month schedule + per-date detail + nurse roster ── */
type ScheduleBooking = {
  id: string; booking_code_display: string | null; booking_date: string; booking_time: string;
  crm_status: CRMBookingStatus; customer_name: string; nurse_id: string | null; nurse_name: string | null;
  product_name: string; service_area_name: string | null;
};
type NurseRow = { id: string; name: string; phone_last4: string; is_active: boolean; today_count: number };

function NurseAdminView() {
  const staff = useCRMStaff();
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(monthOf(today()));

  const [schedule, setSchedule] = useState<ScheduleBooking[]>([]);
  const [schedLoading, setSchedLoading] = useState(true);
  const [schedError, setSchedError] = useState('');

  const [items, setItems] = useState<NurseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSchedule = useCallback(async () => {
    setSchedLoading(true); setSchedError('');
    try {
      const d = await crmGet<{ items: ScheduleBooking[] }>(`/api/crm/nurse?schedule=1&month=${month}`);
      setSchedule(d.items ?? []);
    } catch (e) { setSchedError(e instanceof Error ? e.message : 'Gagal memuat jadwal'); }
    finally { setSchedLoading(false); }
  }, [month]);

  const loadWorkload = useCallback(async () => {
    setLoading(true); setError('');
    try { const d = await crmGet<{ items: NurseRow[] }>(`/api/crm/nurse?date=${date}`); setItems(d.items ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat nurse'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => {
    const t = setTimeout(() => { void loadSchedule(); }, 0);
    return () => clearTimeout(t);
  }, [loadSchedule]);

  useEffect(() => {
    const t = setTimeout(() => { void loadWorkload(); }, 0);
    return () => clearTimeout(t);
  }, [loadWorkload]);

  const selectDate = useCallback((d: string) => {
    setDate(d);
    setMonth(monthOf(d));
  }, []);

  const byDate = useMemo(() => {
    const m = new Map<string, ScheduleBooking[]>();
    for (const b of schedule) {
      const k = b.booking_date.slice(0, 10);
      const arr = m.get(k) ?? [];
      arr.push(b);
      m.set(k, arr);
    }
    return m;
  }, [schedule]);

  const dayInfo = useMemo(() => {
    const m = new Map<string, DayInfo>();
    byDate.forEach((list, k) => {
      // "warn" = masih ada booking aktif yang belum punya nurse — itu yang
      // paling penting terlihat sekilas oleh admin di kalender.
      const warn = list.some((b) => {
        const rank = STATUS_RANK[b.crm_status] ?? 0;
        return rank >= 0 && rank < STATUS_RANK.TREATMENT_COMPLETED && !b.nurse_id;
      });
      const allDone = list.every((b) => {
        const rank = STATUS_RANK[b.crm_status] ?? 0;
        return rank < 0 || rank >= STATUS_RANK.TREATMENT_COMPLETED;
      });
      m.set(k, { count: list.length, allDone, warn });
    });
    return m;
  }, [byDate]);

  const totalBookings = schedule.length;
  const unassigned = schedule.filter((b) => {
    const rank = STATUS_RANK[b.crm_status] ?? 0;
    return rank >= 0 && rank < STATUS_RANK.TREATMENT_COMPLETED && !b.nurse_id;
  }).length;
  const dayBookings = byDate.get(date) ?? [];

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Jadwal Nurse</h1>
          <p className="crm-page-subtitle">Klik tanggal di kalender untuk melihat booking &amp; nurse yang bertugas</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => selectDate(e.target.value)}
          className="h-11 rounded-2xl border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#0f172a] shadow-sm outline-none focus:border-[#205251] focus:ring-2 focus:ring-[#205251]/10"
        />
      </div>

      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        selectedDate={date}
        onSelectDate={selectDate}
        days={dayInfo}
        subtitle={totalBookings > 0
          ? `${totalBookings} booking bulan ini${unassigned > 0 ? ` · ${unassigned} belum ada nurse` : ''}`
          : 'Belum ada booking bulan ini'}
        legend={[
          { swatch: 'bg-[#D6EAEA]', label: 'Ada booking (angka = jumlah)' },
          { swatch: 'bg-[#fef3c7]', label: 'Ada booking belum ada nurse' },
          { swatch: 'bg-[#d1fae5]', label: 'Semua selesai' },
          { swatch: 'border-2 border-[#C9944C] bg-white', label: 'Hari ini' },
        ]}
        loading={schedLoading}
        error={schedError}
        onRetry={loadSchedule}
      />

      {/* Detail booking pada tanggal terpilih: jam, pasien, layanan, nurse, status */}
      <div className="crm-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="crm-section-title">Booking {formatDate(date)}</h2>
          <span className="text-xs font-medium text-[#94a3b8]">{dayBookings.length} booking</span>
        </div>
        {schedLoading ? <LoadingBlock /> : dayBookings.length === 0 ? (
          <p className="py-2 text-sm text-[#94a3b8]">Tidak ada booking pada tanggal ini.</p>
        ) : (
          <div className="space-y-2">
            {dayBookings.map((b) => {
              const terminal = (STATUS_RANK[b.crm_status] ?? 0) < 0;
              return (
                <Link
                  key={b.id}
                  href={crmBookingHref(staff, b.booking_code_display ?? b.id)}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-[#e2e8f0] p-3 transition hover:border-[#8EBFBF] hover:bg-[#D6EAEA]/20 ${terminal ? 'opacity-60' : ''}`}
                >
                  <span className="w-12 flex-shrink-0 text-sm font-bold text-[#205251]">{b.booking_time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0f172a]">{b.customer_name}</p>
                    <p className="truncate text-xs text-[#64748b]">
                      {b.product_name}{b.service_area_name ? ` · ${b.service_area_name}` : ''}
                    </p>
                  </div>
                  {b.nurse_name ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#D6EAEA] px-2.5 py-1 text-[11px] font-semibold text-[#205251]">
                      <Stethoscope size={12} /> {b.nurse_name}
                    </span>
                  ) : !terminal ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-1 text-[11px] font-semibold text-[#b45309]">
                      <UserX size={12} /> Belum ada nurse
                    </span>
                  ) : null}
                  <StatusBadge status={b.crm_status} />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Nurse roster workload for the selected date */}
      <h2 className="crm-section-title">Beban Kerja Nurse — {formatDate(date)}</h2>
      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={loadWorkload} /> : items.length === 0 ? (
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
                  <p className="text-xs font-medium text-[#94a3b8]">Booking tanggal ini</p>
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
