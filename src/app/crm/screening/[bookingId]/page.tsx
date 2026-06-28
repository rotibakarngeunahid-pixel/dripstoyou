'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';

type Booking = { id: string; booking_code_display: string | null; customer_name: string; product_name: string; crm_status: string };
type Screening = {
  blood_pressure: string | null; temperature: string | null; pulse: number | null;
  has_allergy: boolean; allergy_notes: string | null; has_illness_history: boolean; illness_notes: string | null;
  taking_medication: boolean; medication_notes: string | null; is_pregnant: string; nurse_notes: string | null;
  conclusion: string;
};

const CONCLUSIONS = [
  { value: 'SAFE', label: '✅ Aman Treatment', cls: 'border-[#205251] bg-[#D6EAEA] text-[#205251]' },
  { value: 'NEEDS_REVIEW', label: '⚠️ Perlu Review', cls: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'NOT_RECOMMENDED', label: '❌ Tidak Disarankan', cls: 'border-red-400 bg-red-50 text-red-700' },
];

export default function ScreeningPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'' | 'draft' | 'submit'>('');
  const [msg, setMsg] = useState('');

  const [f, setF] = useState({
    bp1: '', bp2: '', temperature: '', pulse: '',
    has_allergy: false, allergy_notes: '', has_illness_history: false, illness_notes: '',
    taking_medication: false, medication_notes: '', is_pregnant: 'NA', nurse_notes: '', conclusion: 'NEEDS_REVIEW',
  });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await crmGet<{ booking: Booking; screening: Screening | null }>(`/api/crm/screening/${bookingId}`);
      setBooking(d.booking);
      if (d.screening) {
        const s = d.screening;
        const [bp1, bp2] = (s.blood_pressure ?? '').split('/');
        setF((prev) => ({
          ...prev,
          bp1: bp1 ?? '', bp2: bp2 ?? '', temperature: s.temperature ?? '', pulse: s.pulse != null ? String(s.pulse) : '',
          has_allergy: !!s.has_allergy, allergy_notes: s.allergy_notes ?? '',
          has_illness_history: !!s.has_illness_history, illness_notes: s.illness_notes ?? '',
          taking_medication: !!s.taking_medication, medication_notes: s.medication_notes ?? '',
          is_pregnant: s.is_pregnant ?? 'NA', nurse_notes: s.nurse_notes ?? '', conclusion: s.conclusion ?? 'NEEDS_REVIEW',
        }));
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function save(submit: boolean) {
    setSaving(submit ? 'submit' : 'draft'); setMsg('');
    try {
      await crmSend(`/api/crm/screening/${bookingId}`, 'POST', {
        booking_id: bookingId,
        blood_pressure: f.bp1 && f.bp2 ? `${f.bp1}/${f.bp2}` : '',
        temperature: f.temperature, pulse: f.pulse,
        has_allergy: f.has_allergy, allergy_notes: f.allergy_notes,
        has_illness_history: f.has_illness_history, illness_notes: f.illness_notes,
        taking_medication: f.taking_medication, medication_notes: f.medication_notes,
        is_pregnant: f.is_pregnant, nurse_notes: f.nurse_notes, conclusion: f.conclusion, submit,
      });
      if (submit) { router.push(`/crm/booking/${booking?.booking_code_display ?? bookingId}`); return; }
      setMsg('Draft tersimpan.');
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setSaving(''); }
  }

  if (loading) return <LoadingBlock />;
  if (error || !booking) return <ErrorBlock message={error || 'Tidak ditemukan'} onRetry={load} />;

  const num = 'min-h-[52px] w-full rounded-xl border border-[#DBDAD7] px-3 py-3 text-lg outline-none focus:border-[#29808B]';

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/crm/booking/${booking.booking_code_display ?? bookingId}`} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]"><ArrowLeft size={16} /> Kembali</Link>
      <h2 className="font-display text-2xl text-[#205251]">Screening</h2>
      <p className="mb-5 text-sm text-[#4d6060]">{booking.customer_name} · {booking.product_name}</p>

      {/* Vitals */}
      <Section title="1. Tanda Vital">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-sm text-[#4d6060]">Tekanan Darah (mmHg)</label>
            <div className="flex items-center gap-2">
              <input inputMode="numeric" value={f.bp1} onChange={(e) => setF({ ...f, bp1: e.target.value })} placeholder="120" className={num} />
              <span className="text-lg text-[#8EBFBF]">/</span>
              <input inputMode="numeric" value={f.bp2} onChange={(e) => setF({ ...f, bp2: e.target.value })} placeholder="80" className={num} />
            </div>
          </div>
          <div>
            <label className="text-sm text-[#4d6060]">Suhu (°C)</label>
            <input inputMode="decimal" value={f.temperature} onChange={(e) => setF({ ...f, temperature: e.target.value })} placeholder="36.7" className={num} />
          </div>
          <div>
            <label className="text-sm text-[#4d6060]">Nadi (bpm)</label>
            <input inputMode="numeric" value={f.pulse} onChange={(e) => setF({ ...f, pulse: e.target.value })} placeholder="76" className={num} />
          </div>
        </div>
      </Section>

      {/* Medical questions */}
      <Section title="2. Pertanyaan Medis">
        <Toggle label="Alergi obat?" value={f.has_allergy} onChange={(v) => setF({ ...f, has_allergy: v })} />
        {f.has_allergy && <NoteField value={f.allergy_notes} onChange={(v) => setF({ ...f, allergy_notes: v })} placeholder="Catatan alergi" />}
        <Toggle label="Riwayat penyakit?" value={f.has_illness_history} onChange={(v) => setF({ ...f, has_illness_history: v })} />
        {f.has_illness_history && <NoteField value={f.illness_notes} onChange={(v) => setF({ ...f, illness_notes: v })} placeholder="Catatan riwayat penyakit" />}
        <Toggle label="Sedang konsumsi obat?" value={f.taking_medication} onChange={(v) => setF({ ...f, taking_medication: v })} />
        {f.taking_medication && <NoteField value={f.medication_notes} onChange={(v) => setF({ ...f, medication_notes: v })} placeholder="Catatan obat" />}
        <div className="mt-3">
          <p className="mb-1 text-sm text-[#4d6060]">Sedang hamil?</p>
          <div className="flex gap-2">
            {[['YES', 'Ya'], ['NO', 'Tidak'], ['NA', 'N.A.']].map(([v, l]) => (
              <button key={v} onClick={() => setF({ ...f, is_pregnant: v })} className={`h-11 flex-1 rounded-xl border text-sm font-medium ${f.is_pregnant === v ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>{l}</button>
            ))}
          </div>
        </div>
      </Section>

      {/* Conclusion */}
      <Section title="3. Kesimpulan">
        <textarea value={f.nurse_notes} onChange={(e) => setF({ ...f, nurse_notes: e.target.value })} placeholder="Catatan nurse" className="mb-3 min-h-[80px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" />
        <div className="space-y-2">
          {CONCLUSIONS.map((c) => (
            <button key={c.value} onClick={() => setF({ ...f, conclusion: c.value })} className={`h-12 w-full rounded-xl border text-sm font-semibold ${f.conclusion === c.value ? c.cls : 'border-[#DBDAD7] text-[#4d6060]'}`}>{c.label}</button>
          ))}
        </div>
      </Section>

      {msg && <p className="mb-3 text-sm text-[#29808B]">{msg}</p>}
      <div className="sticky bottom-20 flex gap-2 md:bottom-4">
        <button onClick={() => save(false)} disabled={!!saving} className="h-12 flex-1 rounded-xl border border-[#205251] bg-white text-sm font-semibold text-[#205251] disabled:opacity-60">{saving === 'draft' ? 'Menyimpan…' : 'Simpan Draft'}</button>
        <button onClick={() => save(true)} disabled={!!saving} className="h-12 flex-1 rounded-xl bg-[#205251] text-sm font-semibold text-white disabled:opacity-60">{saving === 'submit' ? 'Mengirim…' : 'Submit Screening →'}</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-[#DBDAD7] bg-white p-4">
      <h3 className="mb-3 font-display text-lg text-[#205251]">{title}</h3>
      {children}
    </section>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <span className="text-sm text-[#111a1a]">{label}</span>
      <div className="flex gap-2">
        <button onClick={() => onChange(true)} className={`h-10 w-16 rounded-xl border text-sm font-medium ${value ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>Ya</button>
        <button onClick={() => onChange(false)} className={`h-10 w-16 rounded-xl border text-sm font-medium ${!value ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>Tidak</button>
      </div>
    </div>
  );
}
function NoteField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" />;
}
