'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { crmGet } from '@/lib/crm-client';
import { formatDate } from '@/lib/crm-format';
import { STATUS_RANK, type CRMBookingStatus } from '@/lib/crm-status';
import StatusBadge from '@/components/crm/StatusBadge';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';
import { useCRMStaff } from '../CRMShell';

const today = () => new Date().toISOString().slice(0, 10);

export default function NursePage() {
  const staff = useCRMStaff();
  const isNurse = staff?.role === 'NURSE';
  return isNurse ? <NursePortal /> : <NurseAdminView />;
}

/* ── Nurse's own daily schedule ─────────────────────────────────────────────── */
type PortalBooking = {
  id: string; booking_code_display: string | null; booking_time: string; crm_status: CRMBookingStatus;
  customer_name: string; product_name: string; service_area_name: string | null;
};

function nurseCTA(status: CRMBookingStatus, id: string, code: string | null) {
  const rank = STATUS_RANK[status] ?? 0;
  if (rank >= STATUS_RANK.TREATMENT_COMPLETED) return { href: `/crm/booking/${code ?? id}`, label: 'Lihat Detail' };
  if (status === 'CONSENT_SIGNED' || status === 'TREATMENT_IN_PROGRESS') return { href: `/crm/treatment/${id}`, label: 'Treatment' };
  if (status === 'SCREENING_COMPLETED') return { href: `/crm/consent/${id}`, label: 'Open Consent' };
  return { href: `/crm/screening/${id}`, label: 'Start Screening' };
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

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#205251]">Halo, {staff?.name?.split(' ')[0] ?? 'Nurse'}</h2>
          <p className="text-sm text-[#4d6060]">{items.length} hari ini · {doneCount} selesai</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm outline-none focus:border-[#29808B]" />
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : items.length === 0 ? (
        <EmptyState title="Tidak ada jadwal" description={`Belum ada booking untuk ${formatDate(date)}.`} />
      ) : (
        <div className="space-y-3">
          {items.map((b) => {
            const cta = nurseCTA(b.crm_status, b.id, b.booking_code_display);
            return (
              <div key={b.id} className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#205251]">{b.booking_time} · {b.customer_name}</p>
                    <p className="text-sm text-[#4d6060]">{b.product_name} · {b.service_area_name ?? '—'}</p>
                  </div>
                  <StatusBadge status={b.crm_status} />
                </div>
                <Link href={cta.href} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#205251] text-sm font-semibold text-white sm:w-auto sm:px-6">
                  {cta.label}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Admin/Owner: nurse roster + workload ───────────────────────────────────── */
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
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#205251]">Nurse</h2>
          <p className="text-sm text-[#4d6060]">Beban kerja per {formatDate(date)}. Penugasan dilakukan dari halaman detail booking.</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm outline-none focus:border-[#29808B]" />
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : items.length === 0 ? (
        <EmptyState title="Belum ada nurse" description="Tambahkan nurse melalui modul Staff & Role." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <div key={n.id} className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-[#205251]">{n.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${n.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{n.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </div>
              <p className="mt-1 text-xs text-[#8EBFBF]">···{n.phone_last4}</p>
              <p className="mt-3 text-2xl font-semibold text-[#29808B]">{n.today_count}</p>
              <p className="text-xs text-[#4d6060]">booking pada tanggal ini</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
