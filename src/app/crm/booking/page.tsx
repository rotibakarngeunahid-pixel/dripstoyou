'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
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
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
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
      setLoading(false);
    }
  }, [q, status, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#205251]">Booking Management</h2>
          <p className="text-sm text-[#4d6060]">{total} booking</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#205251] px-4 text-sm font-semibold text-white hover:brightness-110"
        >
          <Plus size={18} /> Tambah Booking
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8EBFBF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode / nama / 4 digit HP…"
            className="h-11 w-full rounded-xl border border-[#DBDAD7] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#29808B]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm outline-none focus:border-[#29808B]"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm outline-none focus:border-[#29808B]" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm outline-none focus:border-[#29808B]" />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState title="Belum ada booking" description="Booking baru akan muncul di sini." action={
          <button onClick={() => setShowAdd(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#205251] px-4 text-sm font-semibold text-white">
            <Plus size={16} /> Tambah Booking
          </button>
        } />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-[#DBDAD7] bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#F3F0E7] text-left text-xs uppercase tracking-wide text-[#4d6060]">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Pasien</th>
                  <th className="px-4 py-3">Layanan</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Nurse</th>
                  <th className="px-4 py-3">Bayar</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBDAD7]">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F3F0E7]/60">
                    <td className="px-4 py-3">
                      <Link href={`/crm/booking/${b.booking_code_display ?? b.id}`} className="font-medium text-[#205251] hover:underline">
                        {b.booking_code_display ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{b.customer_name}<span className="block text-xs text-[#8EBFBF]">···{b.customer_phone_last4}</span></td>
                    <td className="px-4 py-3">{b.product_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDayTime(b.booking_date, b.booking_time)}</td>
                    <td className="px-4 py-3">{b.service_area_name ?? '—'}</td>
                    <td className="px-4 py-3">{b.nurse_name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatRupiah(b.paid_amount)} <span className="text-xs text-[#8EBFBF]">/ {formatRupiah(b.total_fee)}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={b.crm_status} /></td>
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
                className="block rounded-2xl border border-[#DBDAD7] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#205251]">{b.booking_code_display ?? '—'}</p>
                    <p className="text-sm">{b.customer_name} · {b.product_name}</p>
                  </div>
                  <StatusBadge status={b.crm_status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#4d6060]">
                  <span>{formatDayTime(b.booking_date, b.booking_time)} · {b.service_area_name ?? '—'}</span>
                  <span>{formatRupiah(b.total_fee)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {showAdd && <AddBookingModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
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
      setErr('Lengkapi semua kolom wajib.');
      return;
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

  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  return (
    <Modal
      open
      onClose={onClose}
      title="Tambah Booking"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
          <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Nama Pasien*<input className={inputCls} value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></label>
          <label className="text-sm">No. HP*<input className={inputCls} value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} placeholder="08…" /></label>
        </div>
        <label className="block text-sm">Alamat*<textarea className="min-h-[60px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" value={form.address} onChange={(e) => set('address', e.target.value)} /></label>
        <label className="block text-sm">Layanan*
          <select className={inputCls} value={form.product_id} onChange={(e) => set('product_id', e.target.value)}>
            <option value="">Pilih layanan</option>
            {opts?.products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatRupiah(p.price_amount)}</option>)}
          </select>
        </label>
        <label className="block text-sm">Area
          <select className={inputCls} value={form.service_area_id} onChange={(e) => set('service_area_id', e.target.value)}>
            <option value="">Tanpa area</option>
            {opts?.areas.map((a) => <option key={a.id} value={a.id}>{a.name} — visit {formatRupiah(a.visit_fee)}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Tanggal*<input type="date" className={inputCls} value={form.booking_date} onChange={(e) => set('booking_date', e.target.value)} /></label>
          <label className="text-sm">Jam*<input type="time" className={inputCls} value={form.booking_time} onChange={(e) => set('booking_time', e.target.value)} /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Tipe Lokasi
            <select className={inputCls} value={form.location_type} onChange={(e) => set('location_type', e.target.value)}>
              {['VILLA', 'HOTEL', 'RUMAH', 'AIRBNB', 'LAINNYA'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm">Jumlah Orang<input type="number" min={1} className={inputCls} value={form.people_count} onChange={(e) => set('people_count', Number(e.target.value))} /></label>
        </div>
        <label className="block text-sm">Catatan<textarea className="min-h-[50px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>

        <div className="rounded-xl bg-[#D6EAEA] px-4 py-3 text-sm text-[#205251]">
          Total estimasi: <strong>{formatRupiah(total)}</strong>
          <span className="block text-xs text-[#29808B]">Layanan {formatRupiah(product?.price_amount ?? 0)} + Visit {formatRupiah(area?.visit_fee ?? 0)}</span>
        </div>
      </div>
    </Modal>
  );
}
