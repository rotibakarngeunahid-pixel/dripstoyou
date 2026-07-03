'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eraser, Stethoscope } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatDateTimeWITA } from '@/lib/crm-format';
import { crmBookingHref } from '@/lib/crm-permissions';
import { STATUS_RANK, type CRMBookingStatus } from '@/lib/crm-status';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';
import { useCRMStaff } from '../../CRMShell';

type Booking = { id: string; booking_code_display: string | null; customer_name: string; product_name: string; crm_status: string };
type Consent = { patient_name_signed: string; agreed_at: string | null } | null;
type Lang = 'en' | 'id';

// Nama rumah sakit / mitra klinis — tampil di klausul 1.
// TODO: ganti '……..' dengan nama mitra klinis resmi begitu kontraknya final.
const CLINICAL_PARTNER = '……..';

type ConsentCopy = {
  flag: string; langName: string;
  title: string; subtitle: string; intro: string;
  clauses: { title: string; body: string }[];
  patient: string; service: string;
  agreeCheckbox: string; nameLabel: string;
  signatureLabel: string; clear: string; signatureHint: string;
  agreedOn: string; submit: string; saving: string;
  alreadyAgreed: (date: string, name: string) => string;
  errName: string; errAgree: string;
};

const COPY: Record<Lang, ConsentCopy> = {
  en: {
    flag: '🇬🇧', langName: 'English',
    title: 'Informed Consent',
    subtitle: 'IV Therapy / Vitamin Injection — Mobile Service',
    intro: 'By signing this document, I acknowledge, understand, and agree to the following terms:',
    clauses: [
      {
        title: 'Authorization of Treatment',
        body: `I voluntarily request and authorize the fully licensed healthcare professionals from Drips to You (operating under the clinical partnership with ${CLINICAL_PARTNER}) to administer Intravenous (IV) Therapy / Vitamin Injections to me.`,
      },
      {
        title: 'Acknowledgement of Risks',
        body: 'I have been fully informed of the intended benefits as well as the minor potential risks associated with IV cannulation, including but not limited to: mild bruising (hematoma), localized swelling, temporary soreness/redness at the injection site, or mild dizziness.',
      },
      {
        title: 'Accuracy of Medical History',
        body: 'I certify that all information provided regarding my health status, medical history, and allergies is true and complete. Drips to You and its partner hospital shall be fully released from any liability regarding adverse reactions caused by undisclosed or inaccurate medical info.',
      },
      {
        title: 'Right to Refuse',
        body: 'I understand that I retain the right to refuse, delay, or terminate the medical procedure at any point during the session at my own discretion.',
      },
    ],
    patient: 'Patient', service: 'Service',
    agreeCheckbox: 'I have read, understood, and agree to all the terms above.',
    nameLabel: 'Patient Full Name',
    signatureLabel: 'Digital Signature', clear: 'Clear',
    signatureHint: 'Signature is optional — full name is required.',
    agreedOn: 'Agreed on', submit: 'Sign & Submit Consent', saving: 'Submitting…',
    alreadyAgreed: (date, name) => `Already signed on ${date} by ${name}.`,
    errName: 'Patient full name is required.',
    errAgree: 'Please tick the agreement checkbox first.',
  },
  id: {
    flag: '🇮🇩', langName: 'Indonesia',
    title: 'Persetujuan Tindakan Medis',
    subtitle: 'Informed Consent — IV Therapy / Injeksi Vitamin',
    intro: 'Dengan menandatangani dokumen ini, saya mengakui, memahami, dan menyetujui ketentuan-ketentuan berikut:',
    clauses: [
      {
        title: 'Otorisasi Tindakan',
        body: `Saya secara sukarela meminta dan memberikan wewenang kepada tenaga kesehatan berlisensi penuh dari Drips to You (yang beroperasi dalam kemitraan klinis dengan ${CLINICAL_PARTNER}) untuk memberikan Terapi Intravena (IV) / Injeksi Vitamin kepada saya.`,
      },
      {
        title: 'Pemahaman Risiko',
        body: 'Saya telah diberi informasi lengkap mengenai manfaat yang diharapkan serta potensi risiko ringan yang terkait dengan pemasangan kanula IV, termasuk namun tidak terbatas pada: memar ringan (hematoma), pembengkakan lokal, nyeri/kemerahan sementara di area suntikan, atau pusing ringan.',
      },
      {
        title: 'Keakuratan Riwayat Medis',
        body: 'Saya menyatakan bahwa seluruh informasi yang saya berikan mengenai kondisi kesehatan, riwayat medis, dan alergi saya adalah benar dan lengkap. Drips to You beserta rumah sakit mitranya dibebaskan sepenuhnya dari segala tanggung jawab atas reaksi merugikan yang disebabkan oleh informasi medis yang tidak diungkapkan atau tidak akurat.',
      },
      {
        title: 'Hak untuk Menolak',
        body: 'Saya memahami bahwa saya tetap berhak menolak, menunda, atau menghentikan prosedur medis kapan pun selama sesi berlangsung atas pertimbangan saya sendiri.',
      },
    ],
    patient: 'Pasien', service: 'Layanan',
    agreeCheckbox: 'Saya telah membaca, memahami, dan menyetujui seluruh ketentuan di atas.',
    nameLabel: 'Nama Lengkap Pasien',
    signatureLabel: 'Tanda Tangan Digital', clear: 'Hapus',
    signatureHint: 'Tanda tangan opsional — nama wajib diisi.',
    agreedOn: 'Disetujui', submit: 'Tandatangani & Kirim', saving: 'Menyimpan…',
    alreadyAgreed: (date, name) => `Sudah disetujui pada ${date} oleh ${name}.`,
    errName: 'Nama lengkap pasien wajib diisi.',
    errAgree: 'Centang persetujuan terlebih dahulu.',
  },
};

export default function ConsentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const staff = useCRMStaff();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [existing, setExisting] = useState<Consent>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await crmGet<{ booking: Booking; consent: Consent }>(`/api/crm/consent/${bookingId}`);
      setBooking(d.booking);
      setExisting(d.consent ?? null);
      if (d.consent) setName(d.consent.patient_name_signed);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#111a1a';
    ctx.lineTo(x, y); ctx.stroke();
    hasDrawn.current = true;
  }
  function end() { drawing.current = false; }
  function clearCanvas() {
    const c = canvasRef.current; if (!c) return;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    hasDrawn.current = false;
  }

  const t = COPY[lang];

  async function submit() {
    setMsg('');
    if (!name.trim()) { setMsg(t.errName); return; }
    if (!agree) { setMsg(t.errAgree); return; }
    setSaving(true);
    try {
      const sig = hasDrawn.current ? canvasRef.current?.toDataURL('image/png') : undefined;
      await crmSend(`/api/crm/consent/${bookingId}`, 'POST', {
        booking_id: bookingId, patient_name_signed: name.trim(), signature_data: sig, language: lang,
      });
      router.push(`/crm/treatment/${bookingId}`);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Gagal menyimpan'); setSaving(false); }
  }

  if (loading) return <LoadingBlock />;
  if (error || !booking) return <ErrorBlock message={error || 'Tidak ditemukan'} onRetry={load} />;

  const backHref = crmBookingHref(staff, booking.booking_code_display ?? bookingId);
  const screeningDone = (STATUS_RANK[booking.crm_status as CRMBookingStatus] ?? 0) >= STATUS_RANK.SCREENING_COMPLETED;

  // Flow guard (mirrors consent.php): consent may only be taken after screening.
  if (!screeningDone && !existing?.agreed_at) {
    const notEligible = booking.crm_status === 'NOT_ELIGIBLE';
    return (
      <div className="crm-page mx-auto max-w-xl">
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]"><ArrowLeft size={16} /> Kembali</Link>
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F0E7] text-[#C9944C]"><Stethoscope size={24} /></span>
          <h2 className="crm-section-title mb-1">{notEligible ? 'Pasien Tidak Memenuhi Syarat' : 'Screening Belum Selesai'}</h2>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">
            {notEligible
              ? 'Hasil screening menyatakan treatment tidak disarankan, sehingga informed consent tidak dapat diambil untuk booking ini.'
              : 'Informed consent hanya bisa diambil setelah screening pasien disubmit. Selesaikan screening terlebih dahulu.'}
          </p>
          <Link href={`/crm/screening/${bookingId}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-[#205251] px-6 text-sm font-semibold text-white">
            {notEligible ? 'Lihat Hasil Screening' : 'Buka Screening →'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-page mx-auto max-w-xl">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]"><ArrowLeft size={16} /> Kembali</Link>

      <div className="crm-card p-6">
        {/* Language switch — patient picks before reading */}
        <div className="mb-5 flex justify-center gap-2">
          {(Object.keys(COPY) as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`h-10 rounded-full border px-4 text-sm font-semibold transition ${
                lang === l ? 'border-[#205251] bg-[#205251] text-white' : 'border-[#DBDAD7] bg-white text-[#4d6060]'
              }`}
            >
              {COPY[l].flag} {COPY[l].langName}
            </button>
          ))}
        </div>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#205251] text-xl font-bold text-[#EAD4AE]">D</div>
          <h2 className="crm-section-title">{t.title}</h2>
          <p className="text-xs text-[#8EBFBF]">{t.subtitle}</p>
        </div>

        {existing?.agreed_at && (
          <div className="mb-4 rounded-xl bg-[#D6EAEA] px-4 py-2 text-sm text-[#205251]">
            {t.alreadyAgreed(formatDateTimeWITA(existing.agreed_at), existing.patient_name_signed)}
          </div>
        )}

        <div className="mb-4 rounded-xl bg-[#F3F0E7] px-4 py-3 text-sm">
          <p><strong>{t.patient}:</strong> {booking.customer_name}</p>
          <p><strong>{t.service}:</strong> {booking.product_name}</p>
        </div>

        <p className="mb-3 text-sm font-medium leading-relaxed text-[#111a1a]">{t.intro}</p>

        <ol className="mb-5 space-y-3">
          {t.clauses.map((c, i) => (
            <li key={c.title} className="text-sm leading-relaxed text-[#111a1a]">
              <span className="font-semibold text-[#205251]">{i + 1}. {c.title}:</span> {c.body}
            </li>
          ))}
        </ol>

        <label className="mb-4 flex items-start gap-2 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
          <span>{t.agreeCheckbox}</span>
        </label>

        <label className="mb-1 block text-sm font-medium text-[#205251]">{t.nameLabel}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4 h-12 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" />

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-[#205251]">{t.signatureLabel}</label>
            <button onClick={clearCanvas} type="button" className="inline-flex items-center gap-1 text-xs text-[#4d6060]"><Eraser size={14} /> {t.clear}</button>
          </div>
          <canvas
            ref={canvasRef}
            width={560}
            height={180}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className="w-full touch-none rounded-xl border border-dashed border-[#8EBFBF] bg-white"
            style={{ height: 180 }}
          />
          <p className="mt-1 text-xs text-[#8EBFBF]">{t.signatureHint}</p>
        </div>

        <p className="mb-4 text-xs text-[#4d6060]">{t.agreedOn}: {formatDateTimeWITA(new Date())}</p>

        {msg && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>}

        <button onClick={submit} disabled={saving} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#205251] text-base font-semibold text-white disabled:opacity-70">
          {saving ? t.saving : t.submit}
        </button>
      </div>
    </div>
  );
}
