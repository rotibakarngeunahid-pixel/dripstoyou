'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays, Clock, CheckCircle2, CircleDollarSign, Wallet,
  AlertTriangle, BarChart3, TrendingUp, ArrowRight,
} from 'lucide-react';
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
  recentBookings: {
    id: string; booking_code_display: string | null; customer_name: string;
    booking_date: string; booking_time: string; crm_status: string;
    product_name: string; nurse_name: string | null;
  }[];
};

const PERIOD_LABEL: Record<string, string> = { week: 'Minggu', month: 'Bulan', quarter: '3 Bulan' };

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
  const totalWeekly = data.weeklyChart.reduce((s, d) => s + d.count, 0);
  const hasWeeklyData = totalWeekly > 0;

  return (
    <div className="crm-page">

      {/* ── Page header ── */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Dashboard</h1>
          <p className="crm-page-subtitle">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {/* Period selector */}
        <div className="flex items-center rounded-xl border border-[#dcd9d0] bg-white p-1 shadow-sm">
          {(['week', 'month', 'quarter'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                period === p
                  ? 'bg-[#205251] text-white shadow-sm'
                  : 'text-[#4d6060] hover:text-[#205251]'
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="crm-stat-grid crm-stat-grid-five">
        <StatCard
          label="Total Booking"
          value={data.stats.totalBooking}
          icon={CalendarDays}
          hint="Semua periode"
        />
        <StatCard
          label="Pending"
          value={data.stats.pending}
          icon={Clock}
          accent="#f59e0b"
          hint="Menunggu konfirmasi"
        />
        <StatCard
          label="Completed"
          value={data.stats.completed}
          icon={CheckCircle2}
          accent="#10b981"
          hint="Berhasil selesai"
        />
        <StatCard
          label="Revenue"
          value={formatRupiah(data.stats.revenue)}
          icon={CircleDollarSign}
          accent="#C9944C"
          hint="Total pendapatan"
        />
        <StatCard
          label="Unpaid"
          value={formatRupiah(data.stats.unpaid)}
          icon={Wallet}
          accent="#ef4444"
          hint="Belum dibayar"
        />
      </div>

      {/* ── Low stock alert ── */}
      {data.lowStockItems.length > 0 && (
        <Link
          href="/crm/inventory"
          className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 shadow-sm transition hover:bg-amber-100"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {data.lowStockItems.length} item stok menipis
              </p>
              <p className="text-xs text-amber-700">
                {data.lowStockItems.slice(0, 3).map((i) => i.name).join(', ')}
                {data.lowStockItems.length > 3 ? '…' : ''}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-700">
            Lihat <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {/* ── Charts ── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Bar chart — 2/3 width */}
        <div className="crm-card lg:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0c2524]">Aktivitas Booking</h2>
              <p className="mt-0.5 text-xs text-[#4d6060]">{PERIOD_LABEL[period]} terakhir</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#D6EAEA] px-3 py-1.5 text-xs font-bold text-[#205251]">
              <TrendingUp size={12} />
              {totalWeekly} booking
            </span>
          </div>

          {!hasWeeklyData ? (
            <div className="flex h-44 flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f2eb] text-[#C9944C]">
                <BarChart3 size={28} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#4d6060]">Belum ada booking</p>
                <p className="text-xs text-[#7a9090]">Data akan muncul saat ada booking masuk</p>
              </div>
            </div>
          ) : (
            <div className="relative h-44">
              {/* Horizontal gridlines */}
              {[0.75, 0.5, 0.25].map((v) => (
                <div
                  key={v}
                  className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[#dcd9d0]"
                  style={{ bottom: `${v * 100}%` }}
                />
              ))}

              {/* Bars */}
              <div className="flex h-full items-end gap-1.5">
                {data.weeklyChart.map((d, i) => {
                  const pct = (d.count / maxWeekly) * 100;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className={`text-xs font-bold leading-none ${d.count > 0 ? 'text-[#0c2524]' : 'text-transparent'}`}>
                        {d.count}
                      </span>
                      <div className="flex w-full flex-1 items-end overflow-hidden rounded-t-lg">
                        <div
                          className="w-full transition-all duration-700"
                          style={{
                            height: `${Math.max(pct, d.count > 0 ? 6 : 0)}%`,
                            background: d.count > 0
                              ? 'linear-gradient(180deg, #205251 0%, #29808B 100%)'
                              : '#ebe8df',
                            borderRadius: '8px 8px 0 0',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7a9090]">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top services — 1/3 width */}
        <div className="crm-card">
          <h2 className="font-display text-base font-bold text-[#0c2524]">Layanan Terpopuler</h2>
          <p className="mb-4 mt-0.5 text-xs text-[#4d6060]">Berdasarkan jumlah booking</p>

          {data.topServices.length === 0 ? (
            <div className="flex h-36 flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f2eb] text-[#C9944C]">
                <BarChart3 size={24} aria-hidden />
              </span>
              <p className="text-xs font-semibold text-[#4d6060]">Belum ada data layanan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.topServices.slice(0, 5).map((s, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-[#D6EAEA] text-[10px] font-bold text-[#205251]">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-xs font-medium text-[#111a1a]">{s.name}</span>
                    <span className="text-xs font-bold text-[#205251]">{s.count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebe8df]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(s.count / maxTop) * 100}%`,
                        background: `linear-gradient(90deg, #205251, #29808B)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent bookings ── */}
      <div className="crm-card p-0">
        <div className="flex items-center justify-between border-b border-[#ebe8df] px-6 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#0c2524]">Booking Terbaru</h2>
            <p className="mt-0.5 text-xs text-[#4d6060]">Update real-time</p>
          </div>
          <Link
            href="/crm/booking"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D6EAEA] px-3 py-1.5 text-xs font-semibold text-[#205251] transition hover:bg-[#C9944C] hover:text-white"
          >
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>

        {data.recentBookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f2eb] text-[#C9944C]">
              <CalendarDays size={28} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#4d6060]">Belum ada booking</p>
              <p className="text-xs text-[#7a9090]">Booking baru akan muncul di sini</p>
            </div>
            <Link
              href="/crm/booking"
              className="crm-button px-5 text-sm"
            >
              + Tambah Booking
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f2eb] px-2 py-2">
            {data.recentBookings.map((b) => {
              const initial = b.customer_name.trim()[0]?.toUpperCase() ?? '?';
              return (
                <Link
                  key={b.id}
                  href={`/crm/booking/${b.booking_code_display ?? b.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[#f5f2eb]"
                >
                  {/* Avatar */}
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#D6EAEA] text-sm font-bold text-[#205251]">
                    {initial}
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#0c2524]">{b.customer_name}</p>
                      {b.booking_code_display && (
                        <span className="hidden font-mono text-xs text-[#7a9090] sm:inline">{b.booking_code_display}</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-[#4d6060]">
                      {b.product_name} · {formatDayTime(b.booking_date, b.booking_time)}
                      {b.nurse_name ? ` · ${b.nurse_name}` : ''}
                    </p>
                  </div>

                  {/* Status */}
                  <StatusBadge status={b.crm_status} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
