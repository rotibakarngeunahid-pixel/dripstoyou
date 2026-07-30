'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Check, CheckCircle2, MessageCircle, ShieldAlert, Star } from 'lucide-react';
import { waGeneralUrl } from '@/lib/whatsapp';
import { Spinner } from '@/components/crm/states';

type Booking = { booking_code_display: string | null; customer_name: string; product_name: string; booking_date: string };
type Feedback = { rating: number; submitted_at: string } | null;

async function readEnvelope(res: Response) {
  try { return await res.json(); } catch { return { success: false, message: 'Server response was invalid' }; }
}

function Shell({ children }: { children: React.ReactNode }) {
  // `crm-shell` defines the --crm-* CSS variables that .crm-card/.crm-button
  // rely on. This page lives outside the authenticated CRM layout, so without
  // it those variables are undefined and the card renders flat.
  return (
    <div className="crm-shell flex min-h-screen items-center justify-center bg-[#F3F0E7] px-4 py-10 font-ui">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function Brand() {
  return (
    <div className="mb-5 text-center">
      <Image src="/img/drips-to-you-bali-icon.webp" alt="Drips To You - Bali" width={48} height={48} className="mx-auto mb-2" />
      <p className="font-display text-sm font-bold tracking-wide text-[#205251]">DRIPS TO YOU - BALI</p>
    </div>
  );
}

const EXPECTATION_OPTIONS = [
  { value: 'YA', label: 'Yes' },
  { value: 'SEBAGIAN', label: 'Partially' },
  { value: 'TIDAK', label: 'No' },
] as const;

const PUNCTUALITY_OPTIONS = [
  { value: 'ON_TIME', label: 'Yes' },
  { value: 'SLIGHTLY_LATE', label: 'Slightly late' },
  { value: 'VERY_LATE', label: 'More than 15 min late' },
] as const;

const REFERRAL_OPTIONS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'GOOGLE_SEARCH', label: 'Google Search' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'FRIEND_FAMILY', label: 'Friend / Family' },
  { value: 'DOCTOR_CLINIC', label: 'Doctor / Clinic' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'OTHER', label: 'Other' },
] as const;

const REBOOK_OPTIONS = [
  { value: 'DEFINITELY', label: 'Definitely' },
  { value: 'MAYBE', label: 'Maybe' },
  { value: 'NOT_SURE', label: 'Not sure' },
  { value: 'NO', label: 'No' },
] as const;

const NURSE_ASPECT_OPTIONS = [
  { value: 'PROFESSIONALISM', label: 'Professionalism' },
  { value: 'FRIENDLINESS', label: 'Friendliness' },
  { value: 'CLEAR_EXPLANATION', label: 'Clear explanation' },
  { value: 'HYGIENE_CLEANLINESS', label: 'Hygiene & cleanliness' },
  { value: 'PUNCTUALITY', label: 'Punctuality' },
] as const;

type ExpectationValue = (typeof EXPECTATION_OPTIONS)[number]['value'];
type PunctualityValue = (typeof PUNCTUALITY_OPTIONS)[number]['value'];
type ReferralValue = (typeof REFERRAL_OPTIONS)[number]['value'];
type RebookValue = (typeof REBOOK_OPTIONS)[number]['value'];

function SectionLabel({ emoji, title, required }: { emoji: string; title: string; required?: boolean }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#205251]">
      <span className="text-base leading-none">{emoji}</span>
      {title}
      {required && <span className="text-[#C9944C]">*</span>}
    </h3>
  );
}

function StarRating({ value, onChange, invalid }: { value: number; onChange: (n: number) => void; invalid?: boolean }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex justify-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star`}
          className="p-1"
        >
          <Star size={32} className={n <= active ? 'fill-[#C9944C] text-[#C9944C]' : `fill-none ${invalid ? 'text-red-300' : 'text-[#DBDAD7]'}`} />
        </button>
      ))}
    </div>
  );
}

function ChoiceGroup<V extends string>({
  options, value, onChange, columns, invalid,
}: {
  options: readonly { value: V; label: string }[];
  value: V | '';
  onChange: (v: V) => void;
  columns: 2 | 3;
  invalid?: boolean;
}) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`min-h-[44px] rounded-xl border px-2 py-1.5 text-xs font-semibold leading-snug transition ${
            value === opt.value
              ? 'border-[#205251] bg-[#205251] text-white'
              : `bg-white text-[#4d6060] ${invalid ? 'border-red-300' : 'border-[#DBDAD7]'}`
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl border border-[#DBDAD7] bg-white px-3 py-2.5 text-left text-sm text-[#111a1a] transition hover:border-[#29808B]"
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${checked ? 'border-[#205251] bg-[#205251]' : 'border-[#DBDAD7]'}`}>
        {checked && <Check size={14} className="text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

export default function PublicFeedbackPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [existing, setExisting] = useState<Feedback>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState('');

  const [rating, setRating] = useState(0);
  const [nurseRating, setNurseRating] = useState(0);
  const [nurseAspects, setNurseAspects] = useState<string[]>([]);
  const [expectation, setExpectation] = useState<ExpectationValue | ''>('');
  const [punctuality, setPunctuality] = useState<PunctualityValue | ''>('');
  const [comfortRating, setComfortRating] = useState(0);
  const [referralSource, setReferralSource] = useState<ReferralValue | ''>('');
  const [referralOther, setReferralOther] = useState('');
  const [rebookIntent, setRebookIntent] = useState<RebookValue | ''>('');
  const [comments, setComments] = useState('');

  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setNotFound('');
    try {
      const res = await fetch(`/api/feedback/${token}`, { cache: 'no-store' });
      const json = await readEnvelope(res);
      if (!res.ok || json.success === false) {
        setNotFound(json.message ?? 'This link is invalid or has expired.');
        return;
      }
      setBooking(json.data.booking);
      setExisting(json.data.feedback ?? null);
    } catch {
      setNotFound('Connection problem. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  function toggleAspect(v: string) {
    setNurseAspects((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  function isValid() {
    return (
      rating >= 1 &&
      nurseRating >= 1 &&
      expectation !== '' &&
      punctuality !== '' &&
      comfortRating >= 1 &&
      referralSource !== '' &&
      (referralSource !== 'OTHER' || referralOther.trim() !== '') &&
      rebookIntent !== ''
    );
  }

  async function submit() {
    setAttempted(true);
    setMsg('');
    if (!isValid()) {
      setMsg('Please answer all required questions before submitting.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/feedback/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          nurse_rating: nurseRating,
          nurse_aspects: nurseAspects,
          meets_expectation: expectation,
          punctuality,
          comfort_rating: comfortRating,
          referral_source: referralSource,
          referral_source_other: referralSource === 'OTHER' ? referralOther.trim() : undefined,
          rebook_intent: rebookIntent,
          comment: comments.trim() || undefined,
        }),
      });
      const json = await readEnvelope(res);
      if (!res.ok || json.success === false) throw new Error(json.message ?? 'Failed to save feedback');
      setDone(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to save feedback');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="crm-card flex flex-col items-center gap-4 p-10 text-center text-[#60727a]">
          <Spinner className="h-8 w-8" />
          <p className="text-sm font-semibold">Loading...</p>
        </div>
      </Shell>
    );
  }

  if (notFound) {
    return (
      <Shell>
        <Brand />
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><ShieldAlert size={24} /></span>
          <h2 className="crm-section-title mb-1">Invalid Link</h2>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">{notFound}</p>
          <a
            href={waGeneralUrl('Hi, my feedback link doesn\'t seem to be working. Could you please help?')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-sm font-semibold text-white"
          >
            <MessageCircle size={18} /> Contact Us via WhatsApp
          </a>
        </div>
      </Shell>
    );
  }

  if (!booking) return null;

  if (done) {
    return (
      <Shell>
        <Brand />
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]"><CheckCircle2 size={24} /></span>
          <h2 className="crm-section-title mb-1">Thank You!</h2>
          <p className="mx-auto max-w-sm text-sm text-[#4d6060]">
            Your feedback has been received. It means a lot to us and helps us keep improving our service.
          </p>
        </div>
      </Shell>
    );
  }

  // Already submitted before — the public link never overwrites final feedback.
  if (existing) {
    return (
      <Shell>
        <Brand />
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]"><CheckCircle2 size={24} /></span>
          <h2 className="crm-section-title mb-1">Feedback Already Submitted</h2>
          <p className="mx-auto max-w-sm text-sm text-[#4d6060]">
            You&apos;ve already submitted feedback for this visit. Thank you for your time!
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Brand />
      <div className="crm-card p-6">
        <div className="mb-5 text-center">
          <h2 className="font-display text-lg font-bold text-[#205251]">⭐ How was your experience with Drips to You?</h2>
        </div>

        <div className="mb-6 rounded-xl bg-[#F3F0E7] px-4 py-3 text-sm">
          <p><strong>Patient:</strong> {booking.customer_name}</p>
          <p><strong>Treatment:</strong> {booking.product_name}</p>
        </div>

        <div className="space-y-6">
          {/* Overall Rating */}
          <section>
            <SectionLabel emoji="⭐" title="Overall Rating" required />
            <StarRating value={rating} onChange={setRating} invalid={attempted && rating < 1} />
          </section>

          <hr className="border-[#DBDAD7]" />

          {/* Nurse Rating */}
          <section>
            <SectionLabel emoji="💉" title="How would you rate our nurse?" required />
            <StarRating value={nurseRating} onChange={setNurseRating} invalid={attempted && nurseRating < 1} />
            <p className="mb-2 mt-4 text-xs font-medium text-[#4d6060]">What stood out? (optional)</p>
            <div className="space-y-2">
              {NURSE_ASPECT_OPTIONS.map((a) => (
                <CheckboxRow key={a.value} label={a.label} checked={nurseAspects.includes(a.value)} onToggle={() => toggleAspect(a.value)} />
              ))}
            </div>
          </section>

          <hr className="border-[#DBDAD7]" />

          {/* Expectations */}
          <section>
            <SectionLabel emoji="😊" title="Did the treatment meet your expectations?" required />
            <ChoiceGroup options={EXPECTATION_OPTIONS} value={expectation} onChange={setExpectation} columns={3} invalid={attempted && expectation === ''} />
          </section>

          <hr className="border-[#DBDAD7]" />

          {/* Punctuality */}
          <section>
            <SectionLabel emoji="⏰" title="Did our team arrive on time?" required />
            <ChoiceGroup options={PUNCTUALITY_OPTIONS} value={punctuality} onChange={setPunctuality} columns={3} invalid={attempted && punctuality === ''} />
          </section>

          <hr className="border-[#DBDAD7]" />

          {/* Comfort */}
          <section>
            <SectionLabel emoji="💙" title="How comfortable was your treatment experience?" required />
            <StarRating value={comfortRating} onChange={setComfortRating} invalid={attempted && comfortRating < 1} />
          </section>

          <hr className="border-[#DBDAD7]" />

          {/* Referral source */}
          <section>
            <SectionLabel emoji="📍" title="How did you hear about Drips to You?" required />
            <ChoiceGroup options={REFERRAL_OPTIONS} value={referralSource} onChange={setReferralSource} columns={2} invalid={attempted && referralSource === ''} />
            {referralSource === 'OTHER' && (
              <input
                value={referralOther}
                onChange={(e) => setReferralOther(e.target.value)}
                maxLength={191}
                placeholder="Please specify"
                className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-[#29808B] ${
                  attempted && referralOther.trim() === '' ? 'border-red-300' : 'border-[#DBDAD7]'
                }`}
              />
            )}
          </section>

          <hr className="border-[#DBDAD7]" />

          {/* Rebook intent */}
          <section>
            <SectionLabel emoji="🔄" title="Would you book with Drips to You again?" required />
            <ChoiceGroup options={REBOOK_OPTIONS} value={rebookIntent} onChange={setRebookIntent} columns={2} invalid={attempted && rebookIntent === ''} />
          </section>

          <hr className="border-[#DBDAD7]" />

          {/* Comments */}
          <section>
            <SectionLabel emoji="💬" title="Additional Comments (Optional)" />
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              maxLength={2000}
              placeholder="Tell us about your experience or share any suggestions to help us improve."
              className="min-h-[100px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]"
            />
          </section>
        </div>

        {msg && <div className="mb-1 mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>}

        <button
          onClick={submit}
          disabled={saving}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#205251] text-base font-semibold text-white disabled:opacity-70"
        >
          {saving ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </div>
    </Shell>
  );
}
