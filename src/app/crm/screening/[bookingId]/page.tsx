'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { crmBookingHref } from '@/lib/crm-permissions';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';
import FormLockCard from '@/components/crm/FormLockCard';
import { useCRMStaff } from '../../CRMShell';
import { SCREENING_COPY as COPY, type ScreeningLang as Lang } from '@/lib/screening-copy';

type Booking = {
  id: string; booking_code_display: string | null; customer_name: string; product_name: string; crm_status: string;
  booking_date: string; booking_time: string; forms_locked: boolean; forms_open_at: string | null;
};
type Screening = {
  blood_pressure: string | null; temperature: string | null; pulse: number | null;
  has_allergy: boolean; allergy_notes: string | null; has_illness_history: boolean; illness_notes: string | null;
  taking_medication: boolean; medication_notes: string | null; is_pregnant: string; nurse_notes: string | null;
  conclusion: string;
};

export default function ScreeningPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const staff = useCRMStaff();
  const [lang, setLang] = useState<Lang>('id');
  const t = COPY[lang];
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'' | 'draft' | 'submit'>('');
  const [msg, setMsg] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

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
    } catch (e) { setError(e instanceof Error ? e.message : t.loadError); }
    finally { setLoading(false); }
  }, [bookingId, t.loadError]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const backHref = crmBookingHref(staff, booking?.booking_code_display ?? bookingId);

  function validate(): string {
    if (!f.bp1.trim() || !f.bp2.trim()) return t.errBp;
    if (!f.temperature.trim()) return t.errTemp;
    if (!f.pulse.trim()) return t.errPulse;
    return '';
  }

  async function save(submit: boolean) {
    setMsg(''); setDraftSaved(false);
    if (submit) {
      const err = validate();
      if (err) { setMsg(err); return; }
    }
    setSaving(submit ? 'submit' : 'draft');
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
      // Eligible screening flows straight into informed consent;
      // NOT_RECOMMENDED ends the visit (booking becomes NOT_ELIGIBLE).
      if (submit) { router.push(f.conclusion === 'NOT_RECOMMENDED' ? backHref : `/crm/consent/${bookingId}`); return; }
      setDraftSaved(true);
    } catch (e) { setMsg(e instanceof Error ? e.message : t.saveError); }
    finally { setSaving(''); }
  }

  if (loading) return <LoadingBlock />;
  if (error || !booking) return <ErrorBlock message={error || t.notFound} onRetry={load} />;

  // Time gate (mirrors screening.php): form baru terbuka mendekati jadwal booking.
  if (booking.forms_locked) {
    return (
      <FormLockCard
        backHref={backHref}
        formName="Screening"
        customerName={booking.customer_name}
        productName={booking.product_name}
        bookingDate={booking.booking_date}
        bookingTime={booking.booking_time}
        opensAt={booking.forms_open_at}
      />
    );
  }

  const num = 'min-h-[52px] w-full rounded-xl border border-[#DBDAD7] px-3 py-3 text-lg outline-none focus:border-[#29808B]';

  return (
    <div className="crm-page mx-auto max-w-2xl">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]"><ArrowLeft size={16} /> {t.back}</Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="crm-page-title">Screening</h2>
          <p className="crm-page-subtitle">{booking.customer_name} · {booking.product_name}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {(Object.keys(COPY) as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`h-9 rounded-full border px-3 text-xs font-semibold transition ${
                lang === l ? 'border-[#205251] bg-[#205251] text-white' : 'border-[#DBDAD7] bg-white text-[#4d6060]'
              }`}
            >
              {COPY[l].flag} {COPY[l].langName}
            </button>
          ))}
        </div>
      </div>

      {/* Vitals */}
      <Section title={t.section1}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-sm text-[#4d6060]">{t.bpLabel}</label>
            <div className="flex items-center gap-2">
              <input inputMode="numeric" value={f.bp1} onChange={(e) => setF({ ...f, bp1: e.target.value })} placeholder="120" className={num} />
              <span className="text-lg text-[#8EBFBF]">/</span>
              <input inputMode="numeric" value={f.bp2} onChange={(e) => setF({ ...f, bp2: e.target.value })} placeholder="80" className={num} />
            </div>
          </div>
          <div>
            <label className="text-sm text-[#4d6060]">{t.tempLabel}</label>
            <input inputMode="decimal" value={f.temperature} onChange={(e) => setF({ ...f, temperature: e.target.value })} placeholder="36.7" className={num} />
          </div>
          <div>
            <label className="text-sm text-[#4d6060]">{t.pulseLabel}</label>
            <input inputMode="numeric" value={f.pulse} onChange={(e) => setF({ ...f, pulse: e.target.value })} placeholder="76" className={num} />
          </div>
        </div>
      </Section>

      {/* Medical questions */}
      <Section title={t.section2}>
        <Toggle label={t.allergyQ} value={f.has_allergy} onChange={(v) => setF({ ...f, has_allergy: v })} yes={t.yes} no={t.no} />
        {f.has_allergy && <NoteField value={f.allergy_notes} onChange={(v) => setF({ ...f, allergy_notes: v })} placeholder={t.allergyPlaceholder} />}
        <Toggle label={t.illnessQ} value={f.has_illness_history} onChange={(v) => setF({ ...f, has_illness_history: v })} yes={t.yes} no={t.no} />
        {f.has_illness_history && <NoteField value={f.illness_notes} onChange={(v) => setF({ ...f, illness_notes: v })} placeholder={t.illnessPlaceholder} />}
        <Toggle label={t.medicationQ} value={f.taking_medication} onChange={(v) => setF({ ...f, taking_medication: v })} yes={t.yes} no={t.no} />
        {f.taking_medication && <NoteField value={f.medication_notes} onChange={(v) => setF({ ...f, medication_notes: v })} placeholder={t.medicationPlaceholder} />}
        <div className="mt-3">
          <p className="mb-1 text-sm text-[#4d6060]">{t.pregnantQ}</p>
          <div className="flex gap-2">
            {t.pregnantOptions.map((o) => (
              <button key={o.value} onClick={() => setF({ ...f, is_pregnant: o.value })} className={`h-11 flex-1 rounded-xl border text-sm font-medium ${f.is_pregnant === o.value ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>{o.label}</button>
            ))}
          </div>
        </div>
      </Section>

      {/* Conclusion */}
      <Section title={t.section3}>
        <textarea value={f.nurse_notes} onChange={(e) => setF({ ...f, nurse_notes: e.target.value })} placeholder={t.nurseNotesPlaceholder} className="mb-3 min-h-[80px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" />
        <div className="space-y-2">
          {t.conclusions.map((c) => (
            <button key={c.value} onClick={() => setF({ ...f, conclusion: c.value })} className={`h-12 w-full rounded-xl border text-sm font-semibold ${f.conclusion === c.value ? c.cls : 'border-[#DBDAD7] text-[#4d6060]'}`}>{c.label}</button>
          ))}
        </div>
      </Section>

      {msg && <p className="mb-3 text-sm text-[#dc2626]">{msg}</p>}
      {draftSaved && !msg && <p className="mb-3 text-sm text-[#29808B]">{t.draftSaved}</p>}
      <div className="sticky bottom-20 flex gap-2 md:bottom-4">
        <button onClick={() => save(false)} disabled={!!saving} className="h-12 flex-1 rounded-xl border border-[#205251] bg-white text-sm font-semibold text-[#205251] disabled:opacity-60">{saving === 'draft' ? t.savingDraft : t.saveDraft}</button>
        <button
          onClick={() => save(true)}
          disabled={!!saving || !!validate()}
          title={validate() || undefined}
          className="h-12 flex-1 rounded-xl bg-[#205251] text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving === 'submit' ? t.submitting : t.submit}
        </button>
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
function Toggle({ label, value, onChange, yes, no }: { label: string; value: boolean; onChange: (v: boolean) => void; yes: string; no: string }) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <span className="text-sm text-[#111a1a]">{label}</span>
      <div className="flex gap-2">
        <button onClick={() => onChange(true)} className={`h-10 w-16 rounded-xl border text-sm font-medium ${value ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>{yes}</button>
        <button onClick={() => onChange(false)} className={`h-10 w-16 rounded-xl border text-sm font-medium ${!value ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>{no}</button>
      </div>
    </div>
  );
}
function NoteField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" />;
}
