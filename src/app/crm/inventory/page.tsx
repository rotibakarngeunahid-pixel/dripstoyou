'use client';

import { useCallback, useEffect, useState } from 'react';
import { Package, AlertTriangle, XCircle, CalendarClock, Plus, ArrowLeftRight, PackagePlus, ClipboardList, History, Tags, Pencil, Trash2 } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatDate, formatDateTimeWITA } from '@/lib/crm-format';
import StatCard from '@/components/crm/StatCard';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type Item = {
  id: string; name: string; category_id: string; category_name: string; stock_current: number; stock_minimum: number;
  unit: string; expired_date: string | null; supplier: string | null; price_per_unit: string | null; is_active: boolean;
};
type Category = { id: string; name: string; sort_order: number; is_active: boolean; item_count: number };
type Stats = { total: number; low: number; out: number; expiring: number };
type View = 'items' | 'opname' | 'log';

type MovementLog = {
  id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number;
  reference_type: string | null; reference_id: string | null; notes: string | null; created_at: string;
  item_id: string; item_name: string; unit: string; staff_name: string | null;
};
type ItemOption = { id: string; name: string };

type OpnameSession = {
  id: string; opname_date: string; notes: string | null;
  total_items: number; total_variance: number; created_at: string; staff_name: string | null;
};
type OpnameItemRow = {
  id: string; inventory_item_id: string | null; item_name: string; unit: string;
  system_qty: number; counted_qty: number; variance: number;
};
type OpnameDetail = OpnameSession & { items: OpnameItemRow[] };

const TYPE_BADGE: Record<string, string> = { IN: 'bg-green-100 text-green-700', OUT: 'bg-red-100 text-red-700', ADJUSTMENT: 'bg-amber-100 text-amber-700' };
const TYPE_LABEL: Record<string, string> = { IN: 'Masuk', OUT: 'Keluar', ADJUSTMENT: 'Penyesuaian' };
const REF_LABEL: Record<string, string> = { PURCHASE_ORDER: 'Purchase Order', TREATMENT: 'Treatment', MANUAL: 'Manual', STOCK_OPNAME: 'Stok Opname' };
const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';
const selCls = 'h-11 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm outline-none focus:border-[#29808B]';

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
  const [view, setView] = useState<View>('items');
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, low: 0, out: 0, expiring: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [moveItem, setMoveItem] = useState<Item | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [d, c] = await Promise.all([
        crmGet<{ items: Item[]; stats: Stats }>('/api/crm/inventory'),
        crmGet<{ items: Category[] }>('/api/crm/inventory-category'),
      ]);
      setItems(d.items ?? []); setStats(d.stats); setCategories(c.items ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  const activeItems = items.filter((it) => it.is_active);

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2 className="crm-page-title">Inventory</h2>
          <p className="crm-page-subtitle">Pantau stok, expiry, dan pergerakan item medis.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategoryOpen(true)} className="crm-button-secondary">
            <Tags size={18} /> Kelola Kategori
          </button>
          <button onClick={() => setAddStockOpen(true)} className="crm-button-secondary">
            <PackagePlus size={18} /> Tambah Stok
          </button>
          <button onClick={() => setAddOpen(true)} className="crm-button">
            <Plus size={18} /> Tambah Item
          </button>
        </div>
      </div>

      <div className="crm-stat-grid crm-stat-grid-four">
        <StatCard label="Total Item" value={stats.total} icon={Package} />
        <StatCard label="Stok Menipis" value={stats.low} icon={AlertTriangle} accent="#C9944C" />
        <StatCard label="Habis" value={stats.out} icon={XCircle} accent="#dc2626" />
        <StatCard label="Expired ≤30hr" value={stats.expiring} icon={CalendarClock} accent="#29808B" />
      </div>

      <div className="flex gap-2">
        {([
          { key: 'items', label: 'Item', icon: Package },
          { key: 'opname', label: 'Stok Opname', icon: ClipboardList },
          { key: 'log', label: 'Riwayat Stok', icon: History },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-medium ${view === t.key ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {view === 'items' && (
        loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : items.length === 0 ? (
          <EmptyState title="Belum ada item" description="Tambahkan item medis pertama Anda." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="crm-table-card crm-table-scroll hidden md:block">
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
                        <td className="px-4 py-3">{it.category_name}</td>
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

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {items.map((it) => {
                const st = statusOf(it);
                return (
                  <div key={it.id} className="crm-record-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <button onClick={() => setEditItem(it)} className="text-left font-semibold text-[#205251] hover:underline">
                          {it.name}
                        </button>
                        {it.supplier && (
                          <p className="text-xs text-[#8EBFBF]">{it.supplier}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#4d6060]">
                      <span>{it.category_name}</span>
                      <span>
                        Stok: <strong className="text-[#0c2524]">{it.stock_current}</strong>/{it.stock_minimum} {it.unit}
                      </span>
                      {it.expired_date && (
                        <span>Exp: {formatDate(it.expired_date)}</span>
                      )}
                    </div>

                    <button
                      onClick={() => setMoveItem(it)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#DBDAD7] px-3 py-1.5 text-xs font-medium text-[#205251] transition hover:bg-[#D6EAEA]"
                    >
                      <ArrowLeftRight size={14} /> Update Stok
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}

      {view === 'opname' && <OpnamePanel activeItems={activeItems} onStockChanged={load} />}
      {view === 'log' && <LogPanel />}

      {(addOpen || editItem) && <ItemModal item={editItem} categories={categories} onClose={() => { setAddOpen(false); setEditItem(null); }} onSaved={() => { setAddOpen(false); setEditItem(null); load(); }} />}
      {moveItem && <MovementModal item={moveItem} onClose={() => setMoveItem(null)} onSaved={() => { setMoveItem(null); load(); }} />}
      {addStockOpen && <QuickAddStockModal items={activeItems} onClose={() => setAddStockOpen(false)} onSaved={() => { setAddStockOpen(false); load(); }} />}
      {categoryOpen && <CategoryManagerModal categories={categories} onClose={() => setCategoryOpen(false)} onChanged={load} />}
    </div>
  );
}

function ItemModal({ item, categories, onClose, onSaved }: { item: Item | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const defaultCategoryId = item?.category_id ?? categories.find((c) => c.is_active)?.id ?? categories[0]?.id ?? '';
  const [f, setF] = useState({
    name: item?.name ?? '', category_id: defaultCategoryId, unit: item?.unit ?? 'pcs',
    stock_current: item?.stock_current ?? 0, stock_minimum: item?.stock_minimum ?? 5,
    expired_date: item?.expired_date ?? '', supplier: item?.supplier ?? '', price_per_unit: item?.price_per_unit ?? '',
  });

  async function submit() {
    if (!f.name) { setErr('Nama wajib diisi.'); return; }
    if (!f.category_id) { setErr('Pilih kategori terlebih dahulu.'); return; }
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
          <label className="text-sm">Kategori*
            <select className={inputCls} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
              {categories.length === 0 && <option value="">Belum ada kategori</option>}
              {categories.filter((c) => c.is_active || c.id === defaultCategoryId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}{!c.is_active ? ' (nonaktif)' : ''}</option>
              ))}
            </select>
          </label>
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

/** Quick "Tambah Stok" — pick an item from a dropdown and add stock (IN movement) without leaving the header. */
function QuickAddStockModal({ items, onClose, onSaved }: { items: Item[]; onClose: () => void; onSaved: () => void }) {
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const selected = items.find((it) => it.id === itemId);

  async function submit() {
    if (!itemId) { setErr('Pilih item terlebih dahulu.'); return; }
    if (qty <= 0) { setErr('Jumlah harus lebih dari 0.'); return; }
    setSaving(true); setErr('');
    try { await crmSend('/api/crm/inventory', 'POST', { action: 'movement', inventory_item_id: itemId, type: 'IN', quantity: qty, notes }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Tambah Stok" footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving || !itemId} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Tambah Stok'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        {items.length === 0 ? (
          <p className="text-sm text-[#4d6060]">Belum ada item aktif. Tambahkan item terlebih dahulu.</p>
        ) : (
          <>
            <label className="block text-sm">Item*
              <select className={inputCls} value={itemId} onChange={(e) => setItemId(e.target.value)}>
                {items.map((it) => <option key={it.id} value={it.id}>{it.name} — stok: {it.stock_current} {it.unit}</option>)}
              </select>
            </label>
            {selected && <p className="text-sm text-[#4d6060]">Stok saat ini: <strong>{selected.stock_current} {selected.unit}</strong></p>}
            <label className="block text-sm">Jumlah Masuk*<input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className={inputCls} /></label>
            <label className="block text-sm">Catatan<input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Contoh: Restock dari supplier" /></label>
          </>
        )}
      </div>
    </Modal>
  );
}

/** Stok Opname — bulk physical count reconciliation across all active items, plus history of past sessions. */
function OpnamePanel({ activeItems, onStockChanged }: { activeItems: Item[]; onStockChanged: () => void }) {
  const [counting, setCounting] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [opnameDate, setOpnameDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [sessions, setSessions] = useState<OpnameSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [detail, setDetail] = useState<OpnameDetail | null>(null);
  const limit = 20;

  const loadSessions = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const d = await crmGet<{ items: OpnameSession[]; total: number }>(`/api/crm/inventory?view=opname&limit=${limit}&offset=${page * limit}`);
      setSessions(d.items ?? []); setTotal(d.total ?? 0);
    } catch (e) { setLoadError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { const t = setTimeout(() => { void loadSessions(); }, 0); return () => clearTimeout(t); }, [loadSessions]);

  function startCounting() {
    const init: Record<string, number> = {};
    activeItems.forEach((it) => { init[it.id] = it.stock_current; });
    setCounts(init);
    setNotes('');
    setErr('');
    setCounting(true);
  }

  const varianceCount = activeItems.filter((it) => (counts[it.id] ?? it.stock_current) !== it.stock_current).length;

  async function submitOpname() {
    setSaving(true); setErr('');
    try {
      await crmSend('/api/crm/inventory', 'POST', {
        action: 'opname',
        opname_date: opnameDate,
        notes,
        counts: activeItems.map((it) => ({ inventory_item_id: it.id, counted_qty: counts[it.id] ?? it.stock_current })),
      });
      setCounting(false);
      onStockChanged();
      setPage(0);
      void loadSessions();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  }

  async function openDetail(id: string) {
    try {
      const d = await crmGet<OpnameDetail>(`/api/crm/inventory?view=opname&id=${id}`);
      setDetail(d);
    } catch { /* silent — user can retry by clicking again */ }
  }

  if (counting) {
    return (
      <div className="crm-card space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#174846]">Hitung Fisik Stok</h3>
            <p className="text-sm text-[#4d6060]">Masukkan jumlah fisik hasil hitung untuk setiap item. Selisih dihitung otomatis.</p>
          </div>
          <div className="flex gap-2">
            <label className="text-sm">Tanggal<input type="date" value={opnameDate} onChange={(e) => setOpnameDate(e.target.value)} className={selCls} /></label>
          </div>
        </div>
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        {activeItems.length === 0 ? (
          <EmptyState title="Belum ada item aktif" description="Tambahkan item terlebih dahulu sebelum melakukan stok opname." />
        ) : (
          <div className="crm-table-card crm-table-scroll">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-[#F3F0E7] text-left text-xs uppercase tracking-wide text-[#4d6060]">
                <tr>
                  <th className="px-4 py-3">Item</th><th className="px-4 py-3">Stok Sistem</th><th className="px-4 py-3">Stok Fisik</th><th className="px-4 py-3">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBDAD7]">
                {activeItems.map((it) => {
                  const counted = counts[it.id] ?? it.stock_current;
                  const variance = counted - it.stock_current;
                  return (
                    <tr key={it.id}>
                      <td className="px-4 py-3 font-medium text-[#205251]">{it.name}</td>
                      <td className="px-4 py-3">{it.stock_current} {it.unit}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min={0} value={counted}
                          onChange={(e) => setCounts({ ...counts, [it.id]: Number(e.target.value) })}
                          className="h-10 w-28 rounded-lg border border-[#DBDAD7] px-2 outline-none focus:border-[#29808B]"
                        />
                      </td>
                      <td className={`px-4 py-3 font-semibold ${variance === 0 ? 'text-[#4d6060]' : variance > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {variance > 0 ? `+${variance}` : variance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <label className="block text-sm">Catatan Sesi<input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Contoh: Opname bulanan Juli" /></label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#4d6060]">{varianceCount} dari {activeItems.length} item memiliki selisih.</p>
          <div className="flex gap-2">
            <button onClick={() => setCounting(false)} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
            <button onClick={submitOpname} disabled={saving || activeItems.length === 0} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan Stok Opname'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={startCounting} className="crm-button"><ClipboardList size={18} /> Mulai Stok Opname Baru</button>
      </div>
      {loading ? <LoadingBlock /> : loadError ? <ErrorBlock message={loadError} onRetry={loadSessions} /> : sessions.length === 0 ? (
        <EmptyState title="Belum ada sesi stok opname" description="Sesi hitung fisik akan tercatat di sini setelah Anda menyimpannya." />
      ) : (
        <>
          <div className="crm-list-panel overflow-hidden">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openDetail(s.id)}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#eef4f5] px-4 py-3 text-left text-sm last:border-0 hover:bg-[#F3F0E7]/60"
              >
                <span className="w-40 shrink-0 text-xs text-[#8EBFBF]">{formatDateTimeWITA(s.created_at)}</span>
                <span className="font-medium text-[#205251]">{formatDate(s.opname_date)}</span>
                <span className="text-[#4d6060]">{s.total_items} item dihitung</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.total_variance === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {s.total_variance === 0 ? 'Sesuai' : `Selisih ${s.total_variance} unit`}
                </span>
                <span className="text-xs text-[#8EBFBF]">oleh {s.staff_name ?? 'Sistem'}</span>
                {s.notes && <span className="w-full text-xs text-[#4d6060] sm:w-auto sm:flex-1">{s.notes}</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#4d6060]">{total} sesi</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-lg border border-[#DBDAD7] px-3 py-1.5 disabled:opacity-50">Sebelumnya</button>
              <button disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[#DBDAD7] px-3 py-1.5 disabled:opacity-50">Berikutnya</button>
            </div>
          </div>
        </>
      )}

      {detail && (
        <Modal open onClose={() => setDetail(null)} title={`Detail Opname — ${formatDate(detail.opname_date)}`}>
          <div className="space-y-3">
            <p className="text-sm text-[#4d6060]">
              Oleh <strong>{detail.staff_name ?? 'Sistem'}</strong> · {detail.total_items} item · total selisih {detail.total_variance} unit
              {detail.notes && <> · &ldquo;{detail.notes}&rdquo;</>}
            </p>
            <div className="crm-table-card crm-table-scroll">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-[#F3F0E7] text-left text-xs uppercase tracking-wide text-[#4d6060]">
                  <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Sistem</th><th className="px-3 py-2">Fisik</th><th className="px-3 py-2">Selisih</th></tr>
                </thead>
                <tbody className="divide-y divide-[#DBDAD7]">
                  {detail.items.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 font-medium text-[#205251]">{r.item_name}</td>
                      <td className="px-3 py-2">{r.system_qty} {r.unit}</td>
                      <td className="px-3 py-2">{r.counted_qty} {r.unit}</td>
                      <td className={`px-3 py-2 font-semibold ${r.variance === 0 ? 'text-[#4d6060]' : r.variance > 0 ? 'text-green-700' : 'text-red-700'}`}>{r.variance > 0 ? `+${r.variance}` : r.variance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Riwayat Stok — global, filterable stock movement ledger across all items. */
function LogPanel() {
  const [logs, setLogs] = useState<MovementLog[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [fItem, setFItem] = useState('');
  const [fType, setFType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ view: 'log', limit: String(limit), offset: String(page * limit) });
      if (fItem) p.set('item_id', fItem);
      if (fType) p.set('type', fType);
      if (dateFrom) p.set('date_from', dateFrom);
      if (dateTo) p.set('date_to', dateTo);
      const d = await crmGet<{ items: MovementLog[]; total: number; item_options: ItemOption[] }>(`/api/crm/inventory?${p}`);
      setLogs(d.items ?? []); setTotal(d.total ?? 0); setItemOptions(d.item_options ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [page, fItem, fType, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  return (
    <div className="space-y-4">
      <div className="crm-filter-card grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={fItem} onChange={(e) => { setPage(0); setFItem(e.target.value); }} className={selCls}>
          <option value="">Semua Item</option>
          {itemOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={fType} onChange={(e) => { setPage(0); setFType(e.target.value); }} className={selCls}>
          <option value="">Semua Tipe</option>
          <option value="IN">Masuk</option>
          <option value="OUT">Keluar</option>
          <option value="ADJUSTMENT">Penyesuaian</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setPage(0); setDateFrom(e.target.value); }} className={selCls} />
        <input type="date" value={dateTo} onChange={(e) => { setPage(0); setDateTo(e.target.value); }} className={selCls} />
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : logs.length === 0 ? (
        <EmptyState title="Tidak ada pergerakan stok" description="Coba ubah filter." />
      ) : (
        <>
          <div className="crm-list-panel overflow-hidden">
            {logs.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#eef4f5] px-4 py-3 text-sm last:border-0">
                <span className="w-40 shrink-0 text-xs text-[#8EBFBF]">{formatDateTimeWITA(l.created_at)}</span>
                <span className="font-medium text-[#205251]">{l.item_name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE[l.type] ?? 'bg-gray-100 text-gray-600'}`}>{TYPE_LABEL[l.type] ?? l.type}</span>
                <span className="text-[#4d6060]">{l.quantity} {l.unit}</span>
                <span className="rounded-full bg-[#F3F0E7] px-2 py-0.5 text-[10px] font-medium text-[#4d6060]">{l.reference_type ? (REF_LABEL[l.reference_type] ?? l.reference_type) : '—'}</span>
                <span className="text-xs text-[#8EBFBF]">{l.staff_name ?? 'Sistem'}</span>
                {l.notes && <span className="w-full text-[#4d6060] sm:w-auto sm:flex-1">{l.notes}</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#4d6060]">{total} pergerakan</span>
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

/** Kelola Kategori — add/edit/deactivate/delete inventory categories (with safe reassign-on-delete). */
function CategoryManagerModal({ categories, onClose, onChanged }: { categories: Category[]; onClose: () => void; onChanged: () => void }) {
  const [mode, setMode] = useState<'list' | 'form' | 'delete'>('list');
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function openForm(cat: Category | null) {
    setEditing(cat);
    setName(cat?.name ?? '');
    setSortOrder(cat?.sort_order ?? categories.length);
    setActive(cat?.is_active ?? true);
    setErr('');
    setMode('form');
  }

  function openDelete(cat: Category) {
    setDeleting(cat);
    setReassignTo('');
    setErr('');
    setMode('delete');
  }

  async function submitForm() {
    if (!name.trim()) { setErr('Nama kategori wajib diisi.'); return; }
    setSaving(true); setErr('');
    try {
      await crmSend('/api/crm/inventory-category', 'POST', { id: editing?.id, name: name.trim(), sort_order: sortOrder, is_active: active });
      onChanged();
      setMode('list');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  }

  async function submitDelete() {
    if (!deleting) return;
    if (deleting.item_count > 0 && !reassignTo) { setErr('Pilih kategori pengganti terlebih dahulu.'); return; }
    setSaving(true); setErr('');
    try {
      await crmSend('/api/crm/inventory-category', 'POST', { action: 'delete', id: deleting.id, reassign_to: reassignTo || undefined });
      onChanged();
      setMode('list');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal menghapus'); }
    finally { setSaving(false); }
  }

  if (mode === 'form') {
    return (
      <Modal open onClose={() => setMode('list')} title={editing ? 'Edit Kategori' : 'Tambah Kategori'} footer={
        <div className="flex justify-end gap-2">
          <button onClick={() => setMode('list')} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
          <button onClick={submitForm} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      }>
        <div className="space-y-3">
          {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <label className="block text-sm">Nama Kategori*<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Suplemen" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Urutan<input type="number" className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} /></label>
            <label className="text-sm">Status<select className={inputCls} value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')}><option value="1">Aktif</option><option value="0">Nonaktif</option></select></label>
          </div>
          <p className="text-xs text-[#8EBFBF]">Kategori nonaktif tidak muncul saat menambah item baru, tapi item lama yang masih memakainya tidak terpengaruh.</p>
        </div>
      </Modal>
    );
  }

  if (mode === 'delete' && deleting) {
    const otherCategories = categories.filter((c) => c.id !== deleting.id);
    return (
      <Modal open onClose={() => setMode('list')} title={`Hapus Kategori — ${deleting.name}`} footer={
        <div className="flex justify-end gap-2">
          <button onClick={() => setMode('list')} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
          <button onClick={submitDelete} disabled={saving} className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menghapus…' : 'Hapus Kategori'}</button>
        </div>
      }>
        <div className="space-y-3">
          {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          {deleting.item_count > 0 ? (
            <>
              <p className="text-sm text-[#4d6060]">
                Kategori ini masih dipakai oleh <strong>{deleting.item_count} item</strong>. Pilih kategori pengganti — semua item tersebut akan dipindahkan sebelum kategori ini dihapus.
              </p>
              <label className="block text-sm">Pindahkan item ke*
                <select className={inputCls} value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                  <option value="">Pilih kategori…</option>
                  {otherCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </>
          ) : (
            <p className="text-sm text-[#4d6060]">Kategori ini tidak dipakai oleh item apa pun. Yakin ingin menghapusnya?</p>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Kelola Kategori" footer={
      <div className="flex justify-end">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Tutup</button>
      </div>
    }>
      <div className="space-y-3">
        <button onClick={() => openForm(null)} className="crm-button w-full justify-center"><Plus size={18} /> Tambah Kategori</button>
        <div className="divide-y divide-[#eef4f5] rounded-xl border border-[#DBDAD7]">
          {categories.length === 0 && <p className="px-4 py-3 text-sm text-[#4d6060]">Belum ada kategori.</p>}
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-[#205251]">{c.name}</p>
                <p className="text-xs text-[#8EBFBF]">{c.item_count} item{!c.is_active ? ' · Nonaktif' : ''}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => openForm(c)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DBDAD7] text-[#205251]" aria-label={`Edit ${c.name}`}><Pencil size={14} /></button>
                <button onClick={() => openDelete(c)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DBDAD7] text-red-600" aria-label={`Hapus ${c.name}`}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
