'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatRupiah, initials } from '@/lib/crm-format';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type PatientRow = {
  id: string; name: string; phone_last4: string; booking_count: number;
  total_spend: string | null; is_repeat: boolean; area_name: string | null;
};
type Area = { id: string; name: string };

export default function PatientListPage() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [sort, setSort] = useState('newest');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (repeat) p.set('repeat', '1');
      if (sort) p.set('sort', sort);
      const data = await crmGet<{ items: PatientRow[]; total: number }>(`/api/crm/patient?${p}`);
      setRows(data.items ?? []); setTotal(data.total ?? 0);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat pasien'); }
    finally { setLoading(false); }
  }, [q, repeat, sort]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2 className="crm-page-title">Pasien</h2>
          <p className="crm-page-subtitle">{total} pasien</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="crm-button">
          <Plus size={18} /> Tambah Pasien
        </button>
      </div>

      <div className="crm-filter-card grid gap-2 p-3 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8EBFBF]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / 4 digit HP…" className="h-11 w-full rounded-xl border border-[#DBDAD7] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#29808B]" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm outline-none focus:border-[#29808B]">
          <option value="newest">Terbaru</option>
          <option value="name">Nama A-Z</option>
          <option value="bookings">Paling sering booking</option>
        </select>
        <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> Repeat customer
        </label>
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : rows.length === 0 ? (
        <EmptyState title="Belum ada pasien" description="Tambahkan pasien atau buat booking baru." />
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <Link key={p.id} href={`/crm/pasien/${p.id}`} className="crm-record-card flex items-center gap-3 p-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6EAEA] text-sm font-semibold text-[#205251]">{initials(p.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium text-[#205251]">
                  {p.name}
                  {p.is_repeat && <span className="rounded-full bg-[#C9944C] px-2 py-0.5 text-[10px] font-medium text-white">REPEAT · {p.booking_count}x</span>}
                </p>
                <p className="text-xs text-[#4d6060]">···{p.phone_last4} · {p.area_name ?? 'Tanpa area'}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium text-[#205251]">{formatRupiah(p.total_spend)}</p>
                <p className="text-xs text-[#8EBFBF]">{p.booking_count} booking</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showAdd && <PatientModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

export function PatientModal({
  initial, onClose, onSaved,
}: {
  initial?: { id: string; name: string; phone?: string; email?: string | null; dob?: string | null; address?: string | null; area_id?: string | null; nationality?: string | null; special_notes?: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    name: initial?.name ?? '', phone: initial?.phone ?? '', email: initial?.email ?? '',
    dob: initial?.dob ?? '', address: initial?.address ?? '', area_id: initial?.area_id ?? '',
    nationality: initial?.nationality ?? 'WNI', special_notes: initial?.special_notes ?? '',
  });

  useEffect(() => {
    crmGet<{ areas: Area[] }>('/api/crm/options').then((d) => setAreas(d.areas ?? [])).catch(() => setAreas([]));
  }, []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.name || !form.phone) { setErr('Nama dan No. HP wajib diisi.'); return; }
    setSaving(true); setErr('');
    try {
      await crmSend('/api/crm/patient', 'POST', { ...form, id: initial?.id });
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal menyimpan'); setSaving(false); }
  }

  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  return (
    <Modal open onClose={onClose} title={initial ? 'Edit Pasien' : 'Tambah Pasien'} footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Nama*<input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
          <label className="text-sm">No. HP*<input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08…" /></label>
          <label className="text-sm">Email<input className={inputCls} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /></label>
          <label className="text-sm">Tgl Lahir<input type="date" className={inputCls} value={form.dob ?? ''} onChange={(e) => set('dob', e.target.value)} /></label>
          <label className="text-sm">Area
            <select className={inputCls} value={form.area_id ?? ''} onChange={(e) => set('area_id', e.target.value)}>
              <option value="">Tanpa area</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Kewarganegaraan<input className={inputCls} value={form.nationality ?? ''} onChange={(e) => set('nationality', e.target.value)} /></label>
        </div>
        <label className="block text-sm">Alamat<textarea className="min-h-[50px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} /></label>
        <label className="block text-sm">Catatan Khusus (alergi, kondisi)<textarea className="min-h-[50px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" value={form.special_notes ?? ''} onChange={(e) => set('special_notes', e.target.value)} /></label>
      </div>
    </Modal>
  );
}
