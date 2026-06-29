'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Wallet, TrendingUp, TrendingDown, CircleDollarSign, Receipt } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatRupiah, formatDate } from '@/lib/crm-format';
import StatCard from '@/components/crm/StatCard';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';

type Stats = { omzet: number; paid: number; dp: number; unpaid: number; expense: number; profit: number };
type Payment = { id: string; amount: string; method: string; status: string; paid_at: string | null; booking_code_display: string | null; customer_name: string };
type Expense = { id: string; category: string; description: string; amount: string; expense_date: string };

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const PAY_STATUS: Record<string, string> = { PAID: 'bg-green-100 text-green-700', DP: 'bg-amber-100 text-amber-700', UNPAID: 'bg-red-100 text-red-700' };

function shiftMonth(m: string, delta: number): string {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return `${MONTHS_ID[mo - 1]} ${y}`;
}

export default function FinancePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await crmGet<{ stats: Stats; payments: Payment[]; expenses: Expense[] }>(`/api/crm/finance?month=${month}`);
      setStats(d.stats); setPayments(d.payments ?? []); setExpenses(d.expenses ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="crm-button-secondary h-10 w-10 p-0"><ChevronLeft size={18} /></button>
          <h2 className="crm-page-title">Finance · {monthLabel(month)}</h2>
          <button onClick={() => setMonth(shiftMonth(month, 1))} className="crm-button-secondary h-10 w-10 p-0"><ChevronRight size={18} /></button>
        </div>
        <div className="crm-actions">
          <button onClick={() => setExpOpen(true)} className="crm-button-secondary"><Plus size={16} /> Pengeluaran</button>
          <button onClick={() => setPayOpen(true)} className="crm-button"><Plus size={16} /> Pembayaran</button>
        </div>
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : stats ? (
        <>
          <div className="crm-stat-grid crm-stat-grid-five">
            <StatCard label="Omzet" value={formatRupiah(stats.omzet)} icon={CircleDollarSign} />
            <StatCard label="Paid" value={formatRupiah(stats.paid)} icon={TrendingUp} accent="#16a34a" />
            <StatCard label="Unpaid" value={formatRupiah(stats.unpaid)} icon={Wallet} accent="#dc2626" />
            <StatCard label="Expense" value={formatRupiah(stats.expense)} icon={TrendingDown} accent="#C9944C" />
            <StatCard label="Est. Profit" value={formatRupiah(stats.profit)} icon={Receipt} accent="#29808B" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="crm-section-title">Pembayaran</h3>
              {payments.length === 0 ? <EmptyState title="Belum ada pembayaran" /> : (
                <div className="crm-list-panel overflow-hidden">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-[#eef4f5] px-4 py-3 text-sm last:border-0">
                      <div>
                        <p className="font-medium text-[#205251]">{p.booking_code_display ?? '—'} · {p.customer_name}</p>
                        <p className="text-xs text-[#8EBFBF]">{p.method} · {p.paid_at ? formatDate(p.paid_at) : '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatRupiah(p.amount)}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PAY_STATUS[p.status] ?? ''}`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="crm-section-title">Pengeluaran</h3>
              {expenses.length === 0 ? <EmptyState title="Belum ada pengeluaran" /> : (
                <div className="crm-list-panel overflow-hidden">
                  {expenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between border-b border-[#eef4f5] px-4 py-3 text-sm last:border-0">
                      <div>
                        <p className="font-medium text-[#205251]">{e.description}</p>
                        <p className="text-xs text-[#8EBFBF]">{e.category.replaceAll('_', ' ')} · {formatDate(e.expense_date)}</p>
                      </div>
                      <p className="font-medium text-[#C9944C]">{formatRupiah(e.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {payOpen && <PaymentModal onClose={() => setPayOpen(false)} onSaved={() => { setPayOpen(false); load(); }} />}
      {expOpen && <ExpenseModal onClose={() => setExpOpen(false)} onSaved={() => { setExpOpen(false); load(); }} />}
    </div>
  );
}

type BookingHit = { id: string; booking_code_display: string | null; customer_name: string; total_fee: string | null };

function PaymentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<BookingHit[]>([]);
  const [picked, setPicked] = useState<BookingHit | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [status, setStatus] = useState('PAID');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      if (picked || !q) { setHits([]); return; }
      try { const d = await crmGet<{ items: BookingHit[] }>(`/api/crm/booking?q=${encodeURIComponent(q)}&limit=8`); setHits(d.items ?? []); }
      catch { setHits([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [q, picked]);

  async function submit() {
    if (!picked) { setErr('Pilih booking dulu.'); return; }
    if (!amount || Number(amount) <= 0) { setErr('Jumlah tidak valid.'); return; }
    setSaving(true); setErr('');
    try { await crmSend('/api/crm/finance', 'POST', { action: 'payment', booking_id: picked.id, amount: Number(amount), method, status, notes }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  return (
    <Modal open onClose={onClose} title="Catat Pembayaran" footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        {picked ? (
          <div className="flex items-center justify-between rounded-xl bg-[#D6EAEA] px-3 py-2 text-sm">
            <span className="text-[#205251]">{picked.booking_code_display} · {picked.customer_name} ({formatRupiah(picked.total_fee)})</span>
            <button onClick={() => { setPicked(null); setQ(''); }} className="text-xs text-[#29808B] underline">Ganti</button>
          </div>
        ) : (
          <div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari booking (kode / nama)…" className={inputCls} />
            {hits.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#DBDAD7]">
                {hits.map((h) => (
                  <button key={h.id} onClick={() => { setPicked(h); setAmount(h.total_fee ?? ''); }} className="block w-full border-b border-[#F3F0E7] px-3 py-2 text-left text-sm last:border-0 hover:bg-[#F3F0E7]">
                    {h.booking_code_display ?? '—'} · {h.customer_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Jumlah*<input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="text-sm">Status<select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}><option value="PAID">Lunas</option><option value="DP">DP</option></select></label>
        </div>
        <label className="block text-sm">Metode<select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>{['CASH', 'TRANSFER', 'QRIS', 'DP_CASH', 'DP_TRANSFER', 'DP_QRIS'].map((m) => <option key={m} value={m}>{m.replaceAll('_', ' ')}</option>)}</select></label>
        <label className="block text-sm">Catatan<input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} /></label>
      </div>
    </Modal>
  );
}

function ExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [category, setCategory] = useState('OPERATIONAL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputCls = 'h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]';

  async function submit() {
    if (!description || !amount || Number(amount) <= 0) { setErr('Lengkapi deskripsi dan jumlah.'); return; }
    setSaving(true); setErr('');
    try { await crmSend('/api/crm/finance', 'POST', { action: 'expense', category, description, amount: Number(amount), expense_date: date }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Catat Pengeluaran" footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      <div className="space-y-3">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <label className="block text-sm">Kategori<select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>{['MEDICAL_STOCK', 'NURSE_TRANSPORT', 'MARKETING', 'OPERATIONAL', 'OTHER'].map((c) => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}</select></label>
        <label className="block text-sm">Deskripsi*<input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Jumlah*<input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="text-sm">Tanggal<input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></label>
        </div>
      </div>
    </Modal>
  );
}
