'use client';

import { useCallback, useEffect, useState } from 'react';
import { crmGet } from '@/lib/crm-client';
import { formatDateTimeWITA } from '@/lib/crm-format';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type Log = { id: string; staff_name: string | null; staff_role: string | null; module: string; action: string; detail: string | null; created_at: string };
type StaffOpt = { id: string; name: string };

const ACTION_BADGE: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-700', UPDATE: 'bg-amber-100 text-amber-700', DELETE: 'bg-red-100 text-red-700',
  STATUS_CHANGE: 'bg-violet-100 text-violet-700', LOGIN: 'bg-green-100 text-green-700', LOGOUT: 'bg-gray-100 text-gray-600',
  ASSIGN: 'bg-cyan-100 text-cyan-700', RECEIVE: 'bg-teal-100 text-teal-700', PAYMENT: 'bg-green-100 text-green-700',
  EXPENSE: 'bg-orange-100 text-orange-700', MOVEMENT: 'bg-indigo-100 text-indigo-700',
  STOCK_OPNAME: 'bg-purple-100 text-purple-700',
};

export default function AuditPage() {
  const [items, setItems] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [staff, setStaff] = useState<StaffOpt[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [fStaff, setFStaff] = useState('');
  const [fModule, setFModule] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (fStaff) p.set('staff_id', fStaff);
      if (fModule) p.set('module', fModule);
      if (dateFrom) p.set('date_from', dateFrom);
      if (dateTo) p.set('date_to', dateTo);
      const d = await crmGet<{ items: Log[]; total: number; staff: StaffOpt[]; modules: string[] }>(`/api/crm/audit?${p}`);
      setItems(d.items ?? []); setTotal(d.total ?? 0); setStaff(d.staff ?? []); setModules(d.modules ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [page, fStaff, fModule, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  const selCls = 'h-11 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm outline-none focus:border-[#29808B]';

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2 className="crm-page-title">Audit Log</h2>
          <p className="crm-page-subtitle">{total} aktivitas tercatat</p>
        </div>
      </div>

      <div className="crm-filter-card grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={fStaff} onChange={(e) => { setPage(0); setFStaff(e.target.value); }} className={selCls}>
          <option value="">Semua User</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={fModule} onChange={(e) => { setPage(0); setFModule(e.target.value); }} className={selCls}>
          <option value="">Semua Modul</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setPage(0); setDateFrom(e.target.value); }} className={selCls} />
        <input type="date" value={dateTo} onChange={(e) => { setPage(0); setDateTo(e.target.value); }} className={selCls} />
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : items.length === 0 ? (
        <EmptyState title="Tidak ada aktivitas" description="Coba ubah filter." />
      ) : (
        <>
          <div className="crm-list-panel overflow-hidden">
            {items.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#eef4f5] px-4 py-3 text-sm last:border-0">
                <span className="w-40 shrink-0 text-xs text-[#8EBFBF]">{formatDateTimeWITA(l.created_at)}</span>
                <span className="font-medium text-[#205251]">{l.staff_name ?? 'Sistem'}<span className="ml-1 text-xs text-[#8EBFBF]">{l.staff_role ?? ''}</span></span>
                <span className="rounded-full bg-[#F3F0E7] px-2 py-0.5 text-[10px] font-medium text-[#4d6060]">{l.module}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ACTION_BADGE[l.action] ?? 'bg-gray-100 text-gray-600'}`}>{l.action}</span>
                <span className="w-full text-[#4d6060] sm:w-auto sm:flex-1">{l.detail}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-[#4d6060]">{total} aktivitas</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-lg border border-[#DBDAD7] px-3 py-1.5 disabled:opacity-50">Sebelumnya</button>
              <button disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[#DBDAD7] px-3 py-1.5 disabled:opacity-50">Berikutnya</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
