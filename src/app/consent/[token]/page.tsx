'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, Download, Eraser, MessageCircle, ShieldAlert, Stethoscope } from 'lucide-react';
import { CONSENT_COPY as COPY, type ConsentLang as Lang } from '@/lib/consent-copy';
import { downloadConsentPdf } from '@/lib/consent-pdf';
import { formatDateTimeWITA } from '@/lib/crm-format';
import { STATUS_RANK, type CRMBookingStatus } from '@/lib/crm-status';
import { waGeneralUrl } from '@/lib/whatsapp';
import { Spinner } from '@/components/crm/states';

type Booking = { id: string; booking_code_display: string | null; customer_name: string; product_name: string; crm_status: string };
type Consent = {
  patient_name_signed: string; agreed_at: string | null;
  consent_language?: Lang | null; signature_data?: string | null;
} | null;

async function readEnvelope(res: Response) {
  try { return await res.json(); } catch { return { success: false, message: 'Respons server tidak valid' }; }
}

function Shell({ children }: { children: React.ReactNode }) {
  // `crm-shell` isn't just a name here — it's what defines the --crm-* CSS
  // variables (surface, radius, shadow, heading color, ...) that .crm-card /
  // .crm-section-title / .crm-button rely on. This page lives outside the
  // authenticated CRM layout (the only other place that class is applied), so
  // without it those variables are undefined and the card renders flat: no
  // background contrast, no rounded corners, no shadow.
  return (
    <div className="crm-shell flex min-h-screen items-center justify-center bg-[#F3F0E7] px-4 py-10 font-ui">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}

function Brand() {
  return (
    <div className="mb-5 text-center">
      <Image
        src="/img/drips-to-you-bali-icon.webp"
        alt="Drips To You - Bali"
        width={48}
        height={48}
        className="mx-auto mb-2"
      />
      <p className="font-display text-sm font-bold tracking-wide text-[#205251]">DRIPS TO YOU - BALI</p>
    </div>
  );
}

export default function PublicConsentPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [existing, setExisting] = useState<Consent>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setNotFound('');
    try {
      const res = await fetch(`/api/consent/${token}`, { cache: 'no-store' });
      const json = await readEnvelope(res);
      if (!res.ok || json.success === false) {
        setNotFound(json.message ?? 'Link tidak valid atau sudah kadaluarsa.');
        return;
      }
      setBooking(json.data.booking);
      setExisting(json.data.consent ?? null);
    } catch {
      setNotFound('Koneksi bermasalah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [token]);

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
      const res = await fetch(`/api/consent/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_name_signed: name.trim(), signature_data: sig, language: lang }),
      });
      const json = await readEnvelope(res);
      if (!res.ok || json.success === false) throw new Error(json.message ?? 'Gagal menyimpan consent');
      setSignatureDataUrl(sig ?? null);
      setDone(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal menyimpan');
      setSaving(false);
    }
  }

  async function handleDownloadPdf(opts: {
    lang: Lang; patientNameSigned: string; agreedOnLabel: string; signature?: string | null;
  }) {
    if (!booking) return;
    setPdfBusy(true);
    try {
      await downloadConsentPdf({
        lang: opts.lang,
        bookingCode: booking.booking_code_display,
        patientName: booking.customer_name,
        serviceName: booking.product_name,
        patientNameSigned: opts.patientNameSigned,
        agreedOnLabel: opts.agreedOnLabel,
        signatureDataUrl: opts.signature,
      });
    } finally {
      setPdfBusy(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="crm-card flex flex-col items-center gap-4 p-10 text-center text-[#60727a]">
          <Spinner className="h-8 w-8" />
          <p className="text-sm font-semibold">Memuat...</p>
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
          <h2 className="crm-section-title mb-1">Link Tidak Valid</h2>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">{notFound}</p>
          <a
            href={waGeneralUrl('Halo, link informed consent saya sepertinya sudah tidak berlaku. Mohon bantuannya.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-sm font-semibold text-white"
          >
            <MessageCircle size={18} /> Hubungi Kami via WhatsApp
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
          <h2 className="crm-section-title mb-1">Terima Kasih!</h2>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">
            Consent Anda sudah kami terima. Tim medis kami akan segera melanjutkan proses treatment.
          </p>
          <button
            type="button"
            disabled={pdfBusy}
            onClick={() => handleDownloadPdf({ lang, patientNameSigned: name.trim(), agreedOnLabel: formatDateTimeWITA(new Date()), signature: signatureDataUrl })}
            className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#205251] px-5 text-sm font-semibold text-[#205251] disabled:opacity-60"
          >
            <Download size={16} /> {pdfBusy ? 'Menyiapkan PDF…' : 'Download PDF'}
          </button>
        </div>
      </Shell>
    );
  }

  // Already signed (in person or via an earlier link) — a public link never
  // amends a finalised legal document, so this is read-only.
  if (existing?.agreed_at) {
    return (
      <Shell>
        <Brand />
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]"><CheckCircle2 size={24} /></span>
          <h2 className="crm-section-title mb-1">Consent Sudah Ditandatangani</h2>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">
            {t.alreadyAgreed(formatDateTimeWITA(existing.agreed_at), existing.patient_name_signed)}
          </p>
          <button
            type="button"
            disabled={pdfBusy}
            onClick={() => handleDownloadPdf({
              lang: existing.consent_language ?? lang,
              patientNameSigned: existing.patient_name_signed,
              agreedOnLabel: formatDateTimeWITA(existing.agreed_at!),
              signature: existing.signature_data,
            })}
            className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#205251] px-5 text-sm font-semibold text-[#205251] disabled:opacity-60"
          >
            <Download size={16} /> {pdfBusy ? 'Menyiapkan PDF…' : 'Download PDF'}
          </button>
        </div>
      </Shell>
    );
  }

  const screeningDone = (STATUS_RANK[booking.crm_status as CRMBookingStatus] ?? 0) >= STATUS_RANK.SCREENING_COMPLETED;
  if (!screeningDone) {
    const notEligible = booking.crm_status === 'NOT_ELIGIBLE';
    return (
      <Shell>
        <Brand />
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F0E7] text-[#C9944C]"><Stethoscope size={24} /></span>
          <h2 className="crm-section-title mb-1">{notEligible ? 'Treatment Belum Dapat Dilanjutkan' : 'Mohon Tunggu Sebentar'}</h2>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">
            {notEligible
              ? 'Berdasarkan hasil pemeriksaan awal, tim kami akan menghubungi Anda untuk informasi lebih lanjut.'
              : 'Tim medis kami sedang menyelesaikan pemeriksaan awal. Silakan coba buka link ini lagi dalam beberapa menit.'}
          </p>
          <a
            href={waGeneralUrl(`Halo, saya ${booking.customer_name}, ingin menanyakan status treatment saya.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-sm font-semibold text-white"
          >
            <MessageCircle size={18} /> Hubungi Kami
          </a>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Brand />
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
          <h2 className="crm-section-title">{t.title}</h2>
          <p className="text-xs text-[#8EBFBF]">{t.subtitle}</p>
        </div>

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
    </Shell>
  );
}
