'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatRupiah } from '@/lib/crm-format';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type Area = { id: string; name: string; visit_fee_amount: string; estimated_arrival_minutes: number | null; is_active: boolean; sort_order: number };

export default function AreaPage() {
  const [rows, setRows] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<Area | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const d = await crmGet<{ items: Area[] }>('/api/crm/area'); setRows(d.items ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-[#205251]">Area & Visit Fee</h2>
        <button onClick={() => setModal('new')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#205251] px-4 text-sm font-semibold text-white"><Plus size={18} /> Tambah Area</button>
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : rows.length === 0 ? (
        <EmptyState title="Belum ada area" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#DBDAD7] bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-[#F3F0E7] text-left text-xs uppercase tracking-wide text-[#4d6060]">
              <tr><th className="px-4 py-3">Area</th><th className="px-4 py-3">Visit Fee</th><th className="px-4 py-3">Estimasi</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-[#DBDAD7]">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-[#F3F0E7]/60">
                  <td className="px-4 py-3"><button onClick={() => setModal(a)} className="font-medium text-[#205251] hover:underline">{a.name}</button></td>
                  <td className="px-4 py-3">{formatRupiah(a.visit_fee_amount)}</td>
                  <td className="px-4 py-3">{a.estimated_arrival_minutes ? `${a.estimated_arrival_minutes} mnt` : '—'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <AreaModal area={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

function AreaModal({ area, onClose, onSaved }: { area: Area | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(area?.name ?? '');
  const [fee, setFee] = useState(area?.visit_fee_amount ?? '');
  const [eta, setEta] = useState(area?.estimated_arrival_minutes != null ? String(area.estimated_arrival_minutes) : '');
  const [active, setActive] = useState(area?.is_active ?? true);
  const [sort, setSort] = useState(area?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  async function submit() {
    if (!name) { setErr('Nama wajib diisi.'); return; }
    setSaving(true); setErr('');
    try { await crmSend('/api/crm/area', 'POST', { id: area?.id, name, visit_fee_amount: fee, estimated_arrival_minutes: eta, is_active: active, sort_order: sort }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={area ? 'Edit Area' : 'Tambah Area'} footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <label className="block text-sm">Nama Area*<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Visit Fee (IDR)<input type="number" className={inputCls} value={fee} onChange={(e) => setFee(e.target.value)} /></label>
          <label className="text-sm">Estimasi (menit)<input type="number" className={inputCls} value={eta} onChange={(e) => setEta(e.target.value)} placeholder="45" /></label>
          <label className="text-sm">Urutan<input type="number" className={inputCls} value={sort} onChange={(e) => setSort(Number(e.target.value))} /></label>
          <label className="text-sm">Status<select className={inputCls} value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')}><option value="1">Aktif</option><option value="0">Nonaktif</option></select></label>
        </div>
      </div>
    </Modal>
  );
}
