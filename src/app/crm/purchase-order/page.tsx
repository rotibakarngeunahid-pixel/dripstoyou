'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, PackageCheck } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatRupiah, formatDate } from '@/lib/crm-format';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type PORow = { id: string; po_number: string; supplier: string; order_date: string; received_date: string | null; total_amount: string; status: string };
type POItem = { id: string; item_name: string; quantity: number; price_per_unit: string; subtotal: string; inventory_item_id: string | null };
type PODetail = PORow & { notes: string | null; items: POItem[] };
type InvItem = { id: string; name: string };

const PO_STATUS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', ORDERED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
};

export default function PurchaseOrderPage() {
  const [rows, setRows] = useState<PORow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const d = await crmGet<{ items: PORow[] }>('/api/crm/purchase-order'); setRows(d.items ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-[#205251]">Purchase Order</h2>
        <button onClick={() => setCreateOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#205251] px-4 text-sm font-semibold text-white hover:brightness-110"><Plus size={18} /> Buat PO</button>
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : rows.length === 0 ? (
        <EmptyState title="Belum ada PO" description="Buat purchase order untuk memesan stok." />
      ) : (
        <div className="space-y-2">
          {rows.map((po) => (
            <button key={po.id} onClick={() => setDetailId(po.id)} className="flex w-full items-center justify-between rounded-2xl border border-[#DBDAD7] bg-white p-4 text-left hover:bg-[#F3F0E7]/60">
              <div>
                <p className="font-semibold text-[#205251]">{po.po_number} · {po.supplier}</p>
                <p className="text-xs text-[#4d6060]">Order {formatDate(po.order_date)}{po.received_date ? ` · Terima ${formatDate(po.received_date)}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-[#205251]">{formatRupiah(po.total_amount)}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PO_STATUS[po.status] ?? 'bg-gray-100'}`}>{po.status}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {createOpen && <CreatePOModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
      {detailId && <PODetailModal id={detailId} onClose={() => setDetailId(null)} onChanged={() => { load(); }} />}
    </div>
  );
}

function PODetailModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [po, setPo] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [receiving, setReceiving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPo(await crmGet<PODetail>(`/api/crm/purchase-order/${id}`)); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  async function receive() {
    setReceiving(true); setErr('');
    try { await crmSend(`/api/crm/purchase-order/${id}`, 'POST', { action: 'receive' }); onChanged(); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); }
    finally { setReceiving(false); }
  }

  return (
    <Modal open onClose={onClose} title={po ? `PO ${po.po_number}` : 'Detail PO'} footer={
      po && po.status === 'ORDERED' ? (
        <button onClick={receive} disabled={receiving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#205251] text-sm font-semibold text-white disabled:opacity-70">
          <PackageCheck size={18} /> {receiving ? 'Memproses…' : 'Terima Stok'}
        </button>
      ) : null
    }>
      {loading ? <LoadingBlock /> : err ? <ErrorBlock message={err} onRetry={load} /> : po ? (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-[#4d6060]">Supplier</span><span>{po.supplier}</span></div>
          <div className="flex justify-between"><span className="text-[#4d6060]">Tgl Order</span><span>{formatDate(po.order_date)}</span></div>
          <div className="flex justify-between"><span className="text-[#4d6060]">Status</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PO_STATUS[po.status]}`}>{po.status}</span></div>
          <div className="rounded-xl border border-[#DBDAD7]">
            {po.items.map((it) => (
              <div key={it.id} className="flex justify-between border-b border-[#F3F0E7] px-3 py-2 last:border-0">
                <span>{it.item_name} <span className="text-xs text-[#8EBFBF]">×{it.quantity}</span></span>
                <span>{formatRupiah(it.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-[#DBDAD7] pt-2 font-semibold text-[#205251]"><span>Total</span><span>{formatRupiah(po.total_amount)}</span></div>
          {po.status === 'RECEIVED' && <p className="text-xs text-green-700">Stok sudah diterima & dicatat sebagai pengeluaran.</p>}
        </div>
      ) : null}
    </Modal>
  );
}

type DraftItem = { inventory_item_id: string; item_name: string; quantity: number; price_per_unit: number };

function CreatePOModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('ORDERED');
  const [items, setItems] = useState<DraftItem[]>([{ inventory_item_id: '', item_name: '', quantity: 1, price_per_unit: 0 }]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { crmGet<{ inventory: InvItem[] }>('/api/crm/options').then((d) => setInventory(d.inventory ?? [])).catch(() => setInventory([])); }, []);

  const total = items.reduce((s, it) => s + it.quantity * it.price_per_unit, 0);
  function setItem(i: number, patch: Partial<DraftItem>) { setItems((x) => x.map((it, idx) => idx === i ? { ...it, ...patch } : it)); }

  async function submit() {
    if (!supplier) { setErr('Supplier wajib diisi.'); return; }
    const valid = items.filter((it) => it.item_name.trim());
    if (valid.length === 0) { setErr('Minimal 1 item dengan nama.'); return; }
    setSaving(true); setErr('');
    try { await crmSend('/api/crm/purchase-order', 'POST', { supplier, order_date: orderDate, status, items: valid }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  return (
    <Modal open onClose={onClose} title="Buat Purchase Order" footer={
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[#205251]">Total {formatRupiah(total)}</span>
        <div className="flex gap-2">
          <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
          <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Supplier*<input className={inputCls} value={supplier} onChange={(e) => setSupplier(e.target.value)} /></label>
          <label className="text-sm">Tgl Order<input type="date" className={inputCls} value={orderDate} onChange={(e) => setOrderDate(e.target.value)} /></label>
        </div>
        <label className="block text-sm">Status<select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}><option value="ORDERED">Ordered</option><option value="DRAFT">Draft</option></select></label>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#205251]">Item</p>
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border border-[#DBDAD7] p-2">
              <div className="mb-2 flex items-center gap-2">
                <select value={it.inventory_item_id} onChange={(e) => { const inv = inventory.find((v) => v.id === e.target.value); setItem(i, { inventory_item_id: e.target.value, item_name: inv?.name ?? it.item_name }); }} className="h-10 flex-1 rounded-lg border border-[#DBDAD7] px-2 text-sm">
                  <option value="">Item baru (ketik nama)</option>
                  {inventory.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <button onClick={() => setItems((x) => x.filter((_, idx) => idx !== i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
              <input value={it.item_name} onChange={(e) => setItem(i, { item_name: e.target.value })} placeholder="Nama item" className="mb-2 h-10 w-full rounded-lg border border-[#DBDAD7] px-2 text-sm" />
              <div className="flex gap-2">
                <input type="number" min={1} value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} placeholder="Qty" className="h-10 w-20 rounded-lg border border-[#DBDAD7] px-2 text-sm" />
                <input type="number" min={0} value={it.price_per_unit} onChange={(e) => setItem(i, { price_per_unit: Number(e.target.value) })} placeholder="Harga/unit" className="h-10 flex-1 rounded-lg border border-[#DBDAD7] px-2 text-sm" />
                <span className="flex h-10 items-center text-sm text-[#4d6060]">{formatRupiah(it.quantity * it.price_per_unit)}</span>
              </div>
            </div>
          ))}
          <button onClick={() => setItems((x) => [...x, { inventory_item_id: '', item_name: '', quantity: 1, price_per_unit: 0 }])} className="inline-flex items-center gap-1 text-sm font-medium text-[#29808B]"><Plus size={16} /> Tambah Item</button>
        </div>
      </div>
    </Modal>
  );
}
