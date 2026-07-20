'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileSignature, Plus, Trash2 } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { crmBookingHref } from '@/lib/crm-permissions';
import StatusBadge from '@/components/crm/StatusBadge';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';
import { useCRMStaff } from '../../CRMShell';

type Booking = {
  id: string; booking_code_display: string | null; customer_name: string; product_name: string; crm_status: string;
  booking_date: string; booking_time: string;
};
type ChecklistItem = { step: string; done: boolean };
type UsedItem = { inventory_item_id: string; name: string; qty: number };
type Treatment = {
  checklist: ChecklistItem[]; items_used: UsedItem[]; nurse_notes: string | null;
  patient_condition_after: string | null; follow_up_recommendation: string | null; completed_at: string | null;
} | null;
type ConsentInfo = { id: string; agreed_at: string | null } | null;
type InvItem = { id: string; name: string; unit: string; stock_current: number };

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { step: 'Verifikasi identitas & consent', done: false },
  { step: 'Pemasangan IV line', done: false },
  { step: 'Pemberian cairan & vitamin', done: false },
  { step: 'Observasi pasca-treatment', done: false },
  { step: 'Pelepasan IV & rapikan area', done: false },
];

const FOLLOWUP_CHIPS = ['Hidrasi cukup 24 jam', 'Reminder sesi berikutnya 2 minggu', 'Istirahat cukup'];

export default function TreatmentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const staff = useCRMStaff();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [consent, setConsent] = useState<ConsentInfo>(null);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'' | 'save' | 'complete'>('');
  const [msg, setMsg] = useState('');
  const [completed, setCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [items, setItems] = useState<UsedItem[]>([]);
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState('');
  const [followups, setFollowups] = useState<string[]>([]);
  const [customFollowup, setCustomFollowup] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [d, opt] = await Promise.all([
        crmGet<{ booking: Booking; treatment: Treatment; consent: ConsentInfo }>(`/api/crm/treatment/${bookingId}`),
        crmGet<{ inventory: InvItem[] }>('/api/crm/options'),
      ]);
      setBooking(d.booking);
      setConsent(d.consent ?? null);
      setInventory(opt.inventory ?? []);
      const t = d.treatment;
      if (t) {
        if (t.checklist?.length) setChecklist(t.checklist);
        if (t.items_used?.length) setItems(t.items_used);
        setNotes(t.nurse_notes ?? '');
        setCondition(t.patient_condition_after ?? '');
        if (t.follow_up_recommendation) setFollowups(t.follow_up_recommendation.split(' · ').filter(Boolean));
        setCompleted(!!t.completed_at);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  function toggleStep(i: number) { setChecklist((c) => c.map((it, idx) => idx === i ? { ...it, done: !it.done } : it)); }
  function addItem() { setItems((x) => [...x, { inventory_item_id: '', name: '', qty: 1 }]); }
  function removeItem(i: number) { setItems((x) => x.filter((_, idx) => idx !== i)); }
  function setItem(i: number, patch: Partial<UsedItem>) { setItems((x) => x.map((it, idx) => idx === i ? { ...it, ...patch } : it)); }
  function toggleChip(c: string) { setFollowups((f) => f.includes(c) ? f.filter((x) => x !== c) : [...f, c]); }

  const backHref = crmBookingHref(staff, booking?.booking_code_display ?? bookingId);
  const consentSigned = !!consent?.agreed_at;

  async function save(complete: boolean) {
    setSaving(complete ? 'complete' : 'save'); setMsg('');
    const allFollowups = [...followups];
    if (customFollowup.trim()) allFollowups.push(customFollowup.trim());
    try {
      await crmSend(`/api/crm/treatment/${bookingId}`, 'POST', {
        booking_id: bookingId,
        checklist,
        items_used: items.filter((it) => it.inventory_item_id || it.name),
        nurse_notes: notes,
        patient_condition_after: condition,
        follow_up_recommendation: allFollowups.join(' · '),
        complete,
      });
      if (complete) { setCompleted(true); setJustCompleted(true); return; }
      setMsg('Treatment tersimpan.');
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setSaving(''); }
  }

  if (loading) return <LoadingBlock />;
  if (error || !booking) return <ErrorBlock message={error || 'Tidak ditemukan'} onRetry={load} />;

  if (justCompleted) {
    return (
      <div className="crm-page mx-auto max-w-2xl">
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]"><CheckCircle2 size={24} /></span>
          <h3 className="crm-section-title mb-1">Treatment Selesai</h3>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">
            Treatment untuk {booking.customer_name} sudah ditandai selesai. Kirim link feedback supaya pasien bisa kasih rating &amp; komentar.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href={`/crm/feedback-link/${bookingId}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-[#205251] px-6 text-sm font-semibold text-white">
              Kirim Link Feedback →
            </Link>
            <Link href={backHref} className="inline-flex h-12 items-center justify-center rounded-xl border border-[#205251] px-6 text-sm font-semibold text-[#205251]">
              Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Flow guard (mirrors treatment.php): no treatment before informed consent.
  if (!consentSigned && !completed) {
    return (
      <div className="crm-page mx-auto max-w-2xl">
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]"><ArrowLeft size={16} /> Kembali</Link>
        <div className="crm-page-header mb-5">
          <div className="min-w-0">
            <h2 className="crm-page-title">Treatment</h2>
            <p className="crm-page-subtitle">{booking.customer_name} · {booking.product_name}</p>
          </div>
          <StatusBadge status={booking.crm_status} />
        </div>
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F0E7] text-[#C9944C]"><FileSignature size={24} /></span>
          <h3 className="crm-section-title mb-1">Informed Consent Belum Ditandatangani</h3>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">
            Sesuai prosedur, pasien wajib menandatangani informed consent setelah screening dan sebelum treatment dimulai.
          </p>
          <Link href={`/crm/consent/${bookingId}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-[#205251] px-6 text-sm font-semibold text-white">
            Buka Informed Consent →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-page mx-auto max-w-2xl">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]"><ArrowLeft size={16} /> Kembali</Link>
      <div className="crm-page-header mb-5">
        <div className="min-w-0">
          <h2 className="crm-page-title">Treatment</h2>
          <p className="crm-page-subtitle">{booking.customer_name} · {booking.product_name}</p>
        </div>
        <StatusBadge status={booking.crm_status} />
      </div>

      {completed && <div className="mb-4 rounded-xl bg-[#D6EAEA] px-4 py-2 text-sm text-[#205251]">Treatment ini sudah ditandai selesai. Perubahan tetap bisa disimpan, namun stok hanya dikurangi sekali.</div>}
      {completed && !consentSigned && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">Booking ini belum memiliki informed consent, sehingga perubahan tidak dapat disimpan sebelum consent ditandatangani.</div>}

      <Section title="Checklist Treatment">
        <div className="space-y-2">
          {checklist.map((it, i) => (
            <button key={i} onClick={() => toggleStep(i)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm ${it.done ? 'border-[#205251] bg-[#D6EAEA]' : 'border-[#DBDAD7]'}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${it.done ? 'border-[#205251] bg-[#205251] text-white' : 'border-[#DBDAD7]'}`}>{it.done ? '✓' : ''}</span>
              <span className={it.done ? 'text-[#205251]' : 'text-[#111a1a]'}>{it.step}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Item Medis Digunakan">
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={it.inventory_item_id}
                onChange={(e) => {
                  const inv = inventory.find((v) => v.id === e.target.value);
                  setItem(i, { inventory_item_id: e.target.value, name: inv?.name ?? it.name });
                }}
                className="h-11 flex-1 rounded-xl border border-[#DBDAD7] px-2 text-sm outline-none focus:border-[#29808B]"
              >
                <option value="">Pilih item…</option>
                {inventory.map((v) => <option key={v.id} value={v.id}>{v.name} (stok {v.stock_current})</option>)}
              </select>
              <input type="number" min={1} value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} className="h-11 w-20 rounded-xl border border-[#DBDAD7] px-2 text-sm outline-none focus:border-[#29808B]" />
              <button onClick={() => removeItem(i)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#29808B]"><Plus size={16} /> Tambah Item</button>
        <p className="mt-2 text-xs text-[#8EBFBF]">⚠ Stok otomatis berkurang saat treatment ditandai selesai.</p>
      </Section>

      <Section title="Catatan & Kondisi Pasien">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan klinis nurse" className="mb-3 min-h-[80px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" />
        <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Kondisi pasien setelah treatment" className="h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" />
      </Section>

      <Section title="Rekomendasi Follow-up">
        <div className="mb-2 flex flex-wrap gap-2">
          {FOLLOWUP_CHIPS.map((c) => (
            <button key={c} onClick={() => toggleChip(c)} className={`rounded-full border px-3 py-1.5 text-sm ${followups.includes(c) ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>{c}</button>
          ))}
        </div>
        <input value={customFollowup} onChange={(e) => setCustomFollowup(e.target.value)} placeholder="Rekomendasi lain (opsional)" className="h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" />
      </Section>

      {msg && <p className="mb-3 text-sm text-[#29808B]">{msg}</p>}
      <div className="sticky bottom-20 flex gap-2 md:bottom-4">
        <button onClick={() => save(false)} disabled={!!saving} className="h-12 flex-1 rounded-xl border border-[#205251] bg-white text-sm font-semibold text-[#205251] disabled:opacity-60">{saving === 'save' ? 'Menyimpan…' : 'Simpan'}</button>
        <button onClick={() => save(true)} disabled={!!saving} className="h-12 flex-1 rounded-xl bg-[#205251] text-sm font-semibold text-white disabled:opacity-60">{saving === 'complete' ? 'Memproses…' : '✓ Mark as Completed'}</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="crm-card">
      <h3 className="crm-section-title mb-3">{title}</h3>
      {children}
    </section>
  );
}
