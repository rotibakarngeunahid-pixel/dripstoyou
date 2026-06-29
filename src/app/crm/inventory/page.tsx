'use client';

import { useCallback, useEffect, useState } from 'react';
import { Package, AlertTriangle, XCircle, CalendarClock, Plus, ArrowLeftRight } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatDate } from '@/lib/crm-format';
import StatCard from '@/components/crm/StatCard';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type Item = {
  id: string; name: string; category: string; stock_current: number; stock_minimum: number;
  unit: string; expired_date: string | null; supplier: string | null; price_per_unit: string | null; is_active: boolean;
};
type Stats = { total: number; low: number; out: number; expiring: number };

const CATEGORIES = ['CAIRAN', 'VITAMIN', 'ALAT', 'OBAT', 'LAINNYA'];

function statusOf(it: Item): { label: string; cls: string } {
  const exp = it.expired_date ? new Date(it.expired_date) : null;
  const now = new Date();
  if (exp && exp < now) return { label: 'Expired', cls: 'bg-red-200 text-red-800' };
  if (it.stock_current === 0) return { label: 'Habis', cls: 'bg-red-100 text-red-700' };
  if (exp && (exp.getTime() - now.getTime()) / 86400000 <= 30) return { label: 'Exp Soon', cls: 'bg-amber-100 text-amber-700' };
  if (it.stock_current <= it.stock_minimum) return { label: 'Menipis', cls: 'bg-orange-100 text-orange-700' };
  return { label: 'Aman', cls: 'bg-green-100 text-green-700' };
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, low: 0, out: 0, expiring: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [moveItem, setMoveItem] = useState<Item | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await crmGet<{ items: Item[]; stats: Stats }>('/api/crm/inventory');
      setItems(d.items ?? []); setStats(d.stats);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2 className="crm-page-title">Inventory</h2>
          <p className="crm-page-subtitle">Pantau stok, expiry, dan pergerakan item medis.</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="crm-button">
          <Plus size={18} /> Tambah Item
        </button>
      </div>

      <div className="crm-stat-grid crm-stat-grid-four">
        <StatCard label="Total Item" value={stats.total} icon={Package} />
        <StatCard label="Stok Menipis" value={stats.low} icon={AlertTriangle} accent="#C9944C" />
        <StatCard label="Habis" value={stats.out} icon={XCircle} accent="#dc2626" />
        <StatCard label="Expired ≤30hr" value={stats.expiring} icon={CalendarClock} accent="#29808B" />
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : items.length === 0 ? (
        <EmptyState title="Belum ada item" description="Tambahkan item medis pertama Anda." />
      ) : (
        <div className="crm-table-card crm-table-scroll">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-[#F3F0E7] text-left text-xs uppercase tracking-wide text-[#4d6060]">
              <tr>
                <th className="px-4 py-3">Item</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Min</th><th className="px-4 py-3">Expired</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DBDAD7]">
              {items.map((it) => {
                const st = statusOf(it);
                return (
                  <tr key={it.id} className="hover:bg-[#F3F0E7]/60">
                    <td className="px-4 py-3"><button onClick={() => setEditItem(it)} className="font-medium text-[#205251] hover:underline">{it.name}</button><span className="block text-xs text-[#8EBFBF]">{it.supplier ?? '—'}</span></td>
                    <td className="px-4 py-3">{it.category}</td>
                    <td className="px-4 py-3">{it.stock_current} {it.unit}</td>
                    <td className="px-4 py-3">{it.stock_minimum}</td>
                    <td className="px-4 py-3">{it.expired_date ? formatDate(it.expired_date) : '—'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setMoveItem(it)} className="inline-flex items-center gap-1 rounded-lg border border-[#DBDAD7] px-2 py-1 text-xs text-[#205251]"><ArrowLeftRight size={14} /> Stok</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(addOpen || editItem) && <ItemModal item={editItem} onClose={() => { setAddOpen(false); setEditItem(null); }} onSaved={() => { setAddOpen(false); setEditItem(null); load(); }} />}
      {moveItem && <MovementModal item={moveItem} onClose={() => setMoveItem(null)} onSaved={() => { setMoveItem(null); load(); }} />}
    </div>
  );
}

function ItemModal({ item, onClose, onSaved }: { item: Item | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState({
    name: item?.name ?? '', category: item?.category ?? 'LAINNYA', unit: item?.unit ?? 'pcs',
    stock_current: item?.stock_current ?? 0, stock_minimum: item?.stock_minimum ?? 5,
    expired_date: item?.expired_date ?? '', supplier: item?.supplier ?? '', price_per_unit: item?.price_per_unit ?? '',
  });
  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  async function submit() {
    if (!f.name) { setErr('Nama wajib diisi.'); return; }
    setSaving(true); setErr('');
    try { await crmSend('/api/crm/inventory', 'POST', { ...f, id: item?.id }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={item ? 'Edit Item' : 'Tambah Item'} footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <label className="block text-sm">Nama*<input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Kategori<select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm">Satuan<input className={inputCls} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></label>
          {!item && <label className="text-sm">Stok Awal<input type="number" className={inputCls} value={f.stock_current} onChange={(e) => setF({ ...f, stock_current: Number(e.target.value) })} /></label>}
          <label className="text-sm">Stok Minimum<input type="number" className={inputCls} value={f.stock_minimum} onChange={(e) => setF({ ...f, stock_minimum: Number(e.target.value) })} /></label>
          <label className="text-sm">Tgl Expired<input type="date" className={inputCls} value={f.expired_date ?? ''} onChange={(e) => setF({ ...f, expired_date: e.target.value })} /></label>
          <label className="text-sm">Harga/Unit<input type="number" className={inputCls} value={f.price_per_unit ?? ''} onChange={(e) => setF({ ...f, price_per_unit: e.target.value })} /></label>
        </div>
        <label className="block text-sm">Supplier<input className={inputCls} value={f.supplier ?? ''} onChange={(e) => setF({ ...f, supplier: e.target.value })} /></label>
      </div>
    </Modal>
  );
}

function MovementModal({ item, onClose, onSaved }: { item: Item; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setSaving(true); setErr('');
    try { await crmSend('/api/crm/inventory', 'POST', { action: 'movement', inventory_item_id: item.id, type, quantity: qty, notes }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={`Pergerakan Stok — ${item.name}`} footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <p className="text-sm text-[#4d6060]">Stok saat ini: <strong>{item.stock_current} {item.unit}</strong></p>
        <div className="flex gap-2">
          {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`h-11 flex-1 rounded-xl border text-sm font-medium ${type === t ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>{t === 'IN' ? 'Masuk' : t === 'OUT' ? 'Keluar' : 'Penyesuaian'}</button>
          ))}
        </div>
        <label className="block text-sm">{type === 'ADJUSTMENT' ? 'Stok menjadi' : 'Jumlah'}<input type="number" min={type === 'ADJUSTMENT' ? 0 : 1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" /></label>
        <label className="block text-sm">Catatan<input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" /></label>
      </div>
    </Modal>
  );
}
