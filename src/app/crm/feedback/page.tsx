'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal, Star } from 'lucide-react';
import { crmGet } from '@/lib/crm-client';
import { formatDayTime } from '@/lib/crm-format';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type FeedbackRow = {
  id: string;
  rating: number;
  submitted_at: string;
  booking_code_display: string | null;
  customer_name: string;
  product_name: string;
};

type Options = { products: { id: string; name: string }[] };

export default function FeedbackListPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState<Options['products']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const hasFilter = !!(dateFrom || dateTo || productId || rating);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (productId) params.set('product_id', productId);
      if (rating) params.set('rating', rating);
      const data = await crmGet<{ items: FeedbackRow[]; total: number }>(`/api/crm/feedback?${params}`);
      setRows(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat feedback');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, productId, rating]);

  useEffect(() => {
    crmGet<Options>('/api/crm/options').then((d) => setProducts(d.products ?? [])).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  function clearFilters() {
    setDateFrom(''); setDateTo(''); setProductId(''); setRating('');
  }

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Feedback</h1>
          <p className="crm-page-subtitle">
            {total > 0 ? `${total} feedback masuk` : 'Feedback treatment dari customer'}
          </p>
        </div>
        <button
          onClick={() => setShowFilter((v) => !v)}
          className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold shadow-sm transition ${
            hasFilter
              ? 'border-[#205251] bg-[#205251] text-white'
              : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#205251] hover:text-[#205251]'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filter</span>
          {hasFilter && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#205251]">!</span>}
        </button>
      </div>

      {showFilter && (
        <div className="crm-filter-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-[#0f172a]">Filter</p>
            {hasFilter && (
              <button onClick={clearFilters} className="text-xs font-semibold text-red-500 hover:text-red-600">Reset</button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#64748b]">Dari Tanggal</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] outline-none focus:border-[#205251]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#64748b]">Sampai Tanggal</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] outline-none focus:border-[#205251]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#64748b]">Treatment</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] outline-none focus:border-[#205251]">
                <option value="">Semua Treatment</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#64748b]">Rating</label>
              <select value={rating} onChange={(e) => setRating(e.target.value)} className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] outline-none focus:border-[#205251]">
                <option value="">Semua Rating</option>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Bintang</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum ada feedback"
          description={hasFilter ? 'Coba ubah filter.' : 'Feedback dari customer akan muncul di sini setelah link diisi.'}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="crm-table-card crm-table-scroll hidden md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Kode</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Pasien</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Treatment</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Rating</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Diisi</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc]">
                {rows.map((f) => (
                  <tr key={f.id} className="group transition hover:bg-[#f8fafc]">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#205251]">{f.booking_code_display ?? '—'}</td>
                    <td className="px-4 py-3.5 font-semibold text-[#0f172a]">{f.customer_name}</td>
                    <td className="px-4 py-3.5 text-sm text-[#374151]">{f.product_name}</td>
                    <td className="px-4 py-3.5"><RatingBadge rating={f.rating} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-[#374151]">{formatDayTime(f.submitted_at)}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/crm/feedback/${f.id}`} className="inline-flex h-8 items-center rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#205251] transition hover:border-[#205251] hover:bg-[#f0f9f9]">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((f) => (
              <Link key={f.id} href={`/crm/feedback/${f.id}`} className="crm-record-card block p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#0f172a]">{f.customer_name}</p>
                    <p className="text-xs text-[#94a3b8]">{f.booking_code_display}</p>
                  </div>
                  <RatingBadge rating={f.rating} />
                </div>
                <div className="mt-3 border-t border-[#f1f5f9] pt-3">
                  <p className="text-sm text-[#374151]">{f.product_name}</p>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-[#64748b]">
                    <span>{formatDayTime(f.submitted_at)}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#205251]">Lihat <ChevronRight size={14} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const low = rating <= 2;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${low ? 'bg-red-100 text-red-700' : 'bg-[#D6EAEA] text-[#205251]'}`}>
      <Star size={12} fill="currentColor" /> {rating}/5
    </span>
  );
}
