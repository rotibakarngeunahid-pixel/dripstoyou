'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, CheckCircle2, CircleDollarSign, Wallet, AlertTriangle } from 'lucide-react';
import { crmGet } from '@/lib/crm-client';
import { formatRupiah, formatDayTime } from '@/lib/crm-format';
import StatCard from '@/components/crm/StatCard';
import StatusBadge from '@/components/crm/StatusBadge';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';

type Data = {
  stats: { totalBooking: number; pending: number; completed: number; revenue: number; unpaid: number };
  weeklyChart: { label: string; date: string; count: number }[];
  topServices: { name: string; count: number }[];
  lowStockItems: { id: string; name: string; stock_current: number; stock_minimum: number; unit: string }[];
  recentBookings: { id: string; booking_code_display: string | null; customer_name: string; booking_date: string; booking_time: string; crm_status: string; product_name: string; nurse_name: string | null }[];
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await crmGet<Data>(`/api/crm/dashboard?period=${period}`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={error || 'Gagal'} onRetry={load} />;

  const maxWeekly = Math.max(1, ...data.weeklyChart.map((d) => d.count));
  const maxTop = Math.max(1, ...data.topServices.map((s) => s.count));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-[#205251]">Dashboard</h2>
        <div className="flex gap-1 rounded-xl bg-white p-1">
          {(['week', 'month', 'quarter'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${period === p ? 'bg-[#205251] text-white' : 'text-[#4d6060]'}`}>
              {p === 'week' ? 'Minggu' : p === 'month' ? 'Bulan' : '3 Bulan'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Booking" value={data.stats.totalBooking} icon={CalendarDays} />
        <StatCard label="Pending" value={data.stats.pending} icon={Clock} accent="#4d6060" />
        <StatCard label="Completed" value={data.stats.completed} icon={CheckCircle2} accent="#29808B" />
        <StatCard label="Revenue" value={formatRupiah(data.stats.revenue)} icon={CircleDollarSign} accent="#C9944C" />
        <StatCard label="Unpaid" value={formatRupiah(data.stats.unpaid)} icon={Wallet} accent="#dc2626" />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        {/* Weekly chart */}
        <div className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Booking 7 Hari Terakhir</p>
          <div className="flex h-40 items-end justify-between gap-2">
            {data.weeklyChart.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-[#205251]">{d.count}</span>
                <div className="flex w-full items-end" style={{ height: 110 }}>
                  <div className="w-full rounded-t-md bg-[#29808B]" style={{ height: `${(d.count / maxWeekly) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }} />
                </div>
                <span className="text-[10px] text-[#4d6060]">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top services */}
        <div className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Layanan Terpopuler</p>
          {data.topServices.length === 0 ? <p className="text-sm text-[#8EBFBF]">Belum ada data.</p> : (
            <div className="space-y-3">
              {data.topServices.map((s, i) => (
                <div key={i}>
                  <div className="mb-1 flex justify-between text-sm"><span className="text-[#111a1a]">{s.name}</span><span className="text-[#4d6060]">{s.count}</span></div>
                  <div className="h-2 w-full rounded-full bg-[#F3F0E7]"><div className="h-2 rounded-full bg-[#205251]" style={{ width: `${(s.count / maxTop) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low stock */}
      {data.lowStockItems.length > 0 && (
        <Link href="/crm/inventory" className="mb-5 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600" size={22} />
            <div>
              <p className="font-medium text-amber-800">{data.lowStockItems.length} item stok menipis</p>
              <p className="text-xs text-amber-700">{data.lowStockItems.slice(0, 3).map((i) => i.name).join(', ')}{data.lowStockItems.length > 3 ? '…' : ''}</p>
            </div>
          </div>
          <span className="text-sm text-amber-700">Lihat →</span>
        </Link>
      )}

      {/* Recent bookings */}
      <div className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Booking Terbaru</p>
        <div className="space-y-2">
          {data.recentBookings.map((b) => (
            <Link key={b.id} href={`/crm/booking/${b.booking_code_display ?? b.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-[#F3F0E7] px-3 py-2 text-sm hover:bg-[#F3F0E7]/60">
              <div className="min-w-0">
                <p className="truncate font-medium text-[#205251]">{b.booking_code_display ?? '—'} · {b.customer_name}</p>
                <p className="truncate text-xs text-[#4d6060]">{b.product_name} · {formatDayTime(b.booking_date, b.booking_time)} · {b.nurse_name ?? 'Tanpa nurse'}</p>
              </div>
              <StatusBadge status={b.crm_status} />
            </Link>
          ))}
          {data.recentBookings.length === 0 && <p className="text-sm text-[#8EBFBF]">Belum ada booking.</p>}
        </div>
      </div>
    </div>
  );
}
