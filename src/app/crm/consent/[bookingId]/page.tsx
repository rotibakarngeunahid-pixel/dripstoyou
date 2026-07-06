'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Copy, Download, Eraser, ExternalLink, Link2, Stethoscope, XCircle } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { downloadConsentPdf } from '@/lib/consent-pdf';
import { formatDateTimeWITA } from '@/lib/crm-format';
import { crmBookingHref } from '@/lib/crm-permissions';
import { STATUS_RANK, type CRMBookingStatus } from '@/lib/crm-status';
import { CONSENT_COPY as COPY, type ConsentLang as Lang } from '@/lib/consent-copy';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';
import { useCRMStaff } from '../../CRMShell';

type Booking = {
  id: string; booking_code_display: string | null; customer_name: string; phone: string | null;
  product_name: string; crm_status: string;
};
type Consent = {
  patient_name_signed: string; agreed_at: string | null; filled_by?: 'NURSE' | 'CLIENT';
  consent_language?: Lang | null; signature_data?: string | null;
} | null;
type LinkStatus = { expires_at: string; used_at: string | null; created_at: string } | null;

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
  const [pdfBusy, setPdfBusy] = useState(false);

  const [linkStatus, setLinkStatus] = useState<LinkStatus>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const loadLinkStatus = useCallback(async () => {
    try {
      const d = await crmGet<{ active: LinkStatus }>(`/api/crm/consent-link/${bookingId}`);
      setLinkStatus(d.active ?? null);
    } catch { /* non-critical — panel just shows "no active link" */ }
  }, [bookingId]);

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
    const t = setTimeout(() => { void load(); void loadLinkStatus(); }, 0);
    return () => clearTimeout(t);
  }, [load, loadLinkStatus]);

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

  async function generateLink() {
    setLinkMsg(''); setLinkBusy(true); setCopied(false);
    try {
      const res = await crmSend<{ token: string; expiresAt: string }>(`/api/crm/consent-link/${bookingId}`, 'POST', {});
      const url = `${window.location.origin}/consent/${res.data?.token}`;
      setLinkUrl(url);
      await loadLinkStatus();
    } catch (e) { setLinkMsg(e instanceof Error ? e.message : 'Gagal membuat link'); }
    finally { setLinkBusy(false); }
  }

  async function revokeLink() {
    setLinkMsg(''); setLinkBusy(true);
    try {
      await crmSend(`/api/crm/consent-link/${bookingId}`, 'POST', { action: 'revoke' });
      setLinkUrl('');
      await loadLinkStatus();
    } catch (e) { setLinkMsg(e instanceof Error ? e.message : 'Gagal mencabut link'); }
    finally { setLinkBusy(false); }
  }

  async function copyLink() {
    if (!linkUrl) return;
    try { await navigator.clipboard.writeText(linkUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { setLinkMsg('Gagal menyalin link'); }
  }

  async function handleDownloadPdf() {
    if (!booking || !existing?.agreed_at) return;
    setPdfBusy(true);
    try {
      await downloadConsentPdf({
        lang: existing.consent_language ?? lang,
        bookingCode: booking.booking_code_display,
        patientName: booking.customer_name,
        serviceName: booking.product_name,
        patientNameSigned: existing.patient_name_signed,
        agreedOnLabel: formatDateTimeWITA(existing.agreed_at),
        signatureDataUrl: existing.signature_data,
      });
    } finally {
      setPdfBusy(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (error || !booking) return <ErrorBlock message={error || 'Tidak ditemukan'} onRetry={load} />;

  const backHref = crmBookingHref(staff, booking.booking_code_display ?? bookingId);
  const screeningDone = (STATUS_RANK[booking.crm_status as CRMBookingStatus] ?? 0) >= STATUS_RANK.SCREENING_COMPLETED;
  const waMessage = `Halo ${booking.customer_name} 👋\n\nSebelum treatment ${booking.product_name} dimulai, mohon isi formulir persetujuan tindakan medis (informed consent) melalui link berikut:\n${linkUrl}\n\nLink berlaku 48 jam. Terima kasih — Drips To You - Bali 🌿`;

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

      {!existing?.agreed_at && (
        <div className="crm-card mb-4 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#D6EAEA] text-[#205251]"><Link2 size={18} /></span>
            <div>
              <h3 className="text-sm font-bold text-[#111a1a]">Kirim Link ke Pasien</h3>
              <p className="text-xs text-[#4d6060]">Pasien mengisi &amp; menandatangani consent sendiri lewat HP-nya.</p>
            </div>
          </div>

          {linkStatus && !linkUrl && (
            <p className="mb-3 text-xs text-[#4d6060]">
              Link aktif dibuat {formatDateTimeWITA(linkStatus.created_at)}, berlaku sampai {formatDateTimeWITA(linkStatus.expires_at)}.
            </p>
          )}

          {linkUrl ? (
            <>
              <div className="mb-3 rounded-xl border border-[#DBDAD7] bg-[#F3F0E7] px-3 py-2">
                <code className="block truncate text-xs text-[#205251]">{linkUrl}</code>
              </div>
              <div className="flex gap-2">
                <button onClick={copyLink} type="button" className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-[#DBDAD7] text-sm font-medium text-[#205251]">
                  <Copy size={16} /> {copied ? 'Tersalin' : 'Salin'}
                </button>
                <a
                  href={booking.phone ? buildWhatsAppUrl(booking.phone, waMessage) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-semibold text-white ${booking.phone ? 'bg-[#25D366]' : 'pointer-events-none bg-[#8EBFBF]'}`}
                >
                  <ExternalLink size={16} /> Kirim WhatsApp
                </a>
              </div>
              <button onClick={revokeLink} disabled={linkBusy} type="button" className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 disabled:opacity-50">
                <XCircle size={14} /> Cabut link
              </button>
            </>
          ) : (
            <button onClick={generateLink} disabled={linkBusy} type="button" className="crm-button w-full py-2.5 text-sm">
              {linkBusy ? 'Membuat link…' : linkStatus ? 'Buat Link Baru' : 'Buat Link Consent'}
            </button>
          )}

          {linkMsg && <p className="mt-2 text-xs text-red-600">{linkMsg}</p>}
        </div>
      )}

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
          <Image
            src="https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image/drips-to-you-bali-icon.webp?tr=bg-remove"
            alt="Drips To You - Bali"
            width={48}
            height={48}
            className="mx-auto mb-2"
          />
          <h2 className="crm-section-title">{t.title}</h2>
          <p className="text-xs text-[#8EBFBF]">{t.subtitle}</p>
        </div>

        {existing?.agreed_at && (
          <div className="mb-4 rounded-xl bg-[#D6EAEA] px-4 py-3 text-sm text-[#205251]">
            <p>
              {t.alreadyAgreed(formatDateTimeWITA(existing.agreed_at), existing.patient_name_signed)}
              {existing.filled_by === 'CLIENT' && ' Diisi mandiri oleh pasien via link.'}
            </p>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={() => { void handleDownloadPdf(); }}
              className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#205251] px-3 text-xs font-semibold text-[#205251] disabled:opacity-60"
            >
              <Download size={14} /> {pdfBusy ? 'Menyiapkan PDF…' : 'Download PDF'}
            </button>
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
