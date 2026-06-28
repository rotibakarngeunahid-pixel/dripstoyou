'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatRupiah } from '@/lib/crm-format';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type Service = {
  id: string; name: string; short_description: string | null; price_amount: string; price_label: string | null;
  label: string | null; is_active: boolean; show_on_homepage: boolean; homepage_order: number;
};

export default function LayananPage() {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<Service | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const d = await crmGet<{ items: Service[] }>('/api/crm/service'); setRows(d.items ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-[#205251]">Layanan</h2>
        <button onClick={() => setModal('new')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#205251] px-4 text-sm font-semibold text-white"><Plus size={18} /> Tambah Layanan</button>
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : rows.length === 0 ? (
        <EmptyState title="Belum ada layanan" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#DBDAD7] bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-[#F3F0E7] text-left text-xs uppercase tracking-wide text-[#4d6060]">
              <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Harga</th><th className="px-4 py-3">Label</th><th className="px-4 py-3">Homepage</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-[#DBDAD7]">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-[#F3F0E7]/60">
                  <td className="px-4 py-3"><button onClick={() => setModal(s)} className="font-medium text-[#205251] hover:underline">{s.name}</button><span className="block max-w-xs truncate text-xs text-[#8EBFBF]">{s.short_description}</span></td>
                  <td className="px-4 py-3">{formatRupiah(s.price_amount)}</td>
                  <td className="px-4 py-3">{s.label ? <span className="rounded-full bg-[#EAD4AE] px-2 py-0.5 text-[10px] font-medium text-[#205251]">{s.label}</span> : '—'}</td>
                  <td className="px-4 py-3">{s.show_on_homepage ? 'Ya' : 'Tidak'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <ServiceModal service={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

function ServiceModal({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: service?.name ?? '', short_description: service?.short_description ?? '', price_amount: service?.price_amount ?? '',
    price_label: service?.price_label ?? '', label: service?.label ?? '', is_active: service?.is_active ?? true,
    show_on_homepage: service?.show_on_homepage ?? false, homepage_order: service?.homepage_order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  async function submit() {
    if (!f.name || !f.price_amount) { setErr('Nama dan harga wajib diisi.'); return; }
    setSaving(true); setErr('');
    try { await crmSend('/api/crm/service', 'POST', { ...f, id: service?.id }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={service ? 'Edit Layanan' : 'Tambah Layanan'} footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <label className="block text-sm">Nama*<input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block text-sm">Deskripsi Singkat<textarea className="min-h-[60px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" value={f.short_description ?? ''} onChange={(e) => setF({ ...f, short_description: e.target.value })} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Harga (IDR)*<input type="number" className={inputCls} value={f.price_amount} onChange={(e) => setF({ ...f, price_amount: e.target.value })} /></label>
          <label className="text-sm">Label Harga<input className={inputCls} value={f.price_label ?? ''} onChange={(e) => setF({ ...f, price_label: e.target.value })} placeholder="mis. per sesi" /></label>
          <label className="text-sm">Badge<input className={inputCls} value={f.label ?? ''} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="BEST SELLER" /></label>
          <label className="text-sm">Urutan Homepage<input type="number" className={inputCls} value={f.homepage_order} onChange={(e) => setF({ ...f, homepage_order: Number(e.target.value) })} /></label>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Aktif</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.show_on_homepage} onChange={(e) => setF({ ...f, show_on_homepage: e.target.checked })} /> Tampilkan di homepage</label>
        </div>
      </div>
    </Modal>
  );
}
