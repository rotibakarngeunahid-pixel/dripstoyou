'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatRupiah, formatDayTime } from '@/lib/crm-format';
import { STATUS_LABEL, type CRMBookingStatus } from '@/lib/crm-status';
import StatusBadge from '@/components/crm/StatusBadge';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type BookingRow = {
  id: string;
  booking_code_display: string | null;
  customer_name: string;
  customer_phone_last4: string;
  booking_date: string;
  booking_time: string;
  crm_status: string;
  total_fee: string | null;
  product_name: string;
  service_area_name: string | null;
  nurse_name: string | null;
  paid_amount: string | null;
};

type Options = {
  products: { id: string; name: string; price_amount: string }[];
  areas: { id: string; name: string; visit_fee: string }[];
  nurses: { id: string; name: string }[];
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as CRMBookingStatus[];

export default function BookingListPage() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const hasFilter = !!(status || dateFrom || dateTo);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const data = await crmGet<{ items: BookingRow[]; total: number }>(`/api/crm/booking?${params}`);
      setRows(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat booking');
    } finally {
      setLoading(false); }
  }, [q, status, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  function clearFilters() {
    setStatus(''); setDateFrom(''); setDateTo('');
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f172a]">Booking</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            {total > 0 ? `${total} booking ditemukan` : 'Manajemen booking'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#205251] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95"
        >
          <Plus size={18} /> Tambah Booking
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode, nama, atau 4 digit HP…"
            className="h-11 w-full rounded-2xl border border-[#e2e8f0] bg-white pl-10 pr-4 text-sm text-[#0f172a] shadow-sm outline-none placeholder:text-[#94a3b8] focus:border-[#205251] focus:ring-2 focus:ring-[#205251]/10"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
              <X size={14} />
            </button>
          )}
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

      {/* Filter panel */}
      {showFilter && (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-[#0f172a]">Filter</p>
            {hasFilter && (
              <button onClick={clearFilters} className="text-xs font-semibold text-red-500 hover:text-red-600">
                Reset
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#64748b]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] outline-none focus:border-[#205251]"
              >
                <option value="">Semua Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#64748b]">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] outline-none focus:border-[#205251]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#64748b]">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] outline-none focus:border-[#205251]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum ada booking"
          description={q || hasFilter ? 'Coba ubah kata kunci atau filter.' : 'Booking baru akan muncul di sini.'}
          action={
            !q && !hasFilter ? (
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#205251] px-5 text-sm font-bold text-white"
              >
                <Plus size={16} /> Tambah Booking
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Kode</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Pasien</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Layanan</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Jadwal</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Nurse</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Bayar</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc]">
                {rows.map((b) => (
                  <tr key={b.id} className="group transition hover:bg-[#f8fafc]">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/crm/booking/${b.booking_code_display ?? b.id}`}
                        className="font-mono text-xs font-bold text-[#205251] hover:underline"
                      >
                        {b.booking_code_display ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#0f172a]">{b.customer_name}</p>
                      <p className="text-xs text-[#94a3b8]">···{b.customer_phone_last4}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#374151]">{b.product_name}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-[#374151]">
                      {formatDayTime(b.booking_date, b.booking_time)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#374151]">{b.nurse_name ?? <span className="text-[#94a3b8]">—</span>}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-semibold text-[#0f172a]">{formatRupiah(b.paid_amount)}</p>
                      <p className="text-xs text-[#94a3b8]">/ {formatRupiah(b.total_fee)}</p>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.crm_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((b) => (
              <Link
                key={b.id}
                href={`/crm/booking/${b.booking_code_display ?? b.id}`}
                className="block rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#D6EAEA] text-sm font-bold text-[#205251]">
                      {b.customer_name[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="font-semibold text-[#0f172a]">{b.customer_name}</p>
                      <p className="text-xs text-[#94a3b8]">{b.booking_code_display}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.crm_status} />
                </div>
                <div className="mt-3 border-t border-[#f1f5f9] pt-3">
                  <p className="text-sm text-[#374151]">{b.product_name}</p>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-[#64748b]">
                    <span>{formatDayTime(b.booking_date, b.booking_time)}</span>
                    <span className="font-semibold text-[#0f172a]">{formatRupiah(b.total_fee)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <AddBookingModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />
      )}
    </div>
  );
}

function AddBookingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [opts, setOpts] = useState<Options | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', address: '', product_id: '', service_area_id: '',
    booking_date: '', booking_time: '', location_type: 'VILLA', people_count: 1, notes: '',
  });

  useEffect(() => {
    crmGet<Options>('/api/crm/options').then(setOpts).catch(() => setOpts({ products: [], areas: [], nurses: [] }));
  }, []);

  const product = opts?.products.find((p) => p.id === form.product_id);
  const area = opts?.areas.find((a) => a.id === form.service_area_id);
  const total = (Number(product?.price_amount ?? 0)) + (Number(area?.visit_fee ?? 0));

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setErr('');
    if (!form.customer_name || !form.customer_phone || !form.address || !form.product_id || !form.booking_date || !form.booking_time) {
      setErr('Lengkapi semua kolom wajib.'); return;
    }
    setSaving(true);
    try {
      await crmSend('/api/crm/booking', 'POST', form);
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
      setSaving(false);
    }
  }

  const inputCls = 'h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a] outline-none focus:border-[#205251] focus:bg-white focus:ring-2 focus:ring-[#205251]/10';

  return (
    <Modal
      open
      onClose={onClose}
      title="Tambah Booking"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-11 rounded-xl border border-[#e2e8f0] px-4 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc]">
            Batal
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="h-11 rounded-xl bg-[#205251] px-6 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-70"
          >
            {saving ? 'Menyimpan…' : 'Simpan Booking'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{err}</div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-[#64748b]">
            Nama Pasien *
            <input className={`mt-1 ${inputCls}`} value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} />
          </label>
          <label className="block text-xs font-bold text-[#64748b]">
            No. HP *
            <input className={`mt-1 ${inputCls}`} value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} placeholder="08…" />
          </label>
        </div>
        <label className="block text-xs font-bold text-[#64748b]">
          Alamat *
          <textarea className={`mt-1 min-h-[64px] w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm text-[#0f172a] outline-none focus:border-[#205251] focus:bg-white`} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </label>
        <label className="block text-xs font-bold text-[#64748b]">
          Layanan *
          <select className={`mt-1 ${inputCls}`} value={form.product_id} onChange={(e) => set('product_id', e.target.value)}>
            <option value="">Pilih layanan</option>
            {opts?.products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatRupiah(p.price_amount)}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-[#64748b]">
          Area Layanan
          <select className={`mt-1 ${inputCls}`} value={form.service_area_id} onChange={(e) => set('service_area_id', e.target.value)}>
            <option value="">Tanpa area</option>
            {opts?.areas.map((a) => <option key={a.id} value={a.id}>{a.name} — visit {formatRupiah(a.visit_fee)}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-[#64748b]">
            Tanggal *
            <input type="date" className={`mt-1 ${inputCls}`} value={form.booking_date} onChange={(e) => set('booking_date', e.target.value)} />
          </label>
          <label className="block text-xs font-bold text-[#64748b]">
            Jam *
            <input type="time" className={`mt-1 ${inputCls}`} value={form.booking_time} onChange={(e) => set('booking_time', e.target.value)} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-[#64748b]">
            Tipe Lokasi
            <select className={`mt-1 ${inputCls}`} value={form.location_type} onChange={(e) => set('location_type', e.target.value)}>
              {['VILLA', 'HOTEL', 'RUMAH', 'AIRBNB', 'LAINNYA'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-[#64748b]">
            Jumlah Orang
            <input type="number" min={1} className={`mt-1 ${inputCls}`} value={form.people_count} onChange={(e) => set('people_count', Number(e.target.value))} />
          </label>
        </div>
        <label className="block text-xs font-bold text-[#64748b]">
          Catatan
          <textarea className={`mt-1 min-h-[48px] w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm text-[#0f172a] outline-none focus:border-[#205251] focus:bg-white`} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        {(product || area) && (
          <div className="rounded-xl border border-[#D6EAEA] bg-[#f0f9f9] px-4 py-3">
            <p className="text-xs font-bold text-[#205251]">Estimasi Total</p>
            <p className="mt-0.5 font-display text-xl font-bold text-[#205251]">{formatRupiah(total)}</p>
            <p className="text-xs text-[#64748b]">
              Layanan {formatRupiah(product?.price_amount ?? 0)} + Visit {formatRupiah(area?.visit_fee ?? 0)}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
