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

const STATEMENT =
  'Saya menyatakan telah menerima penjelasan mengenai prosedur IV Therapy, manfaat, serta kemungkinan risikonya. ' +
  'Saya memberikan persetujuan secara sadar dan tanpa paksaan untuk menerima tindakan ini oleh tim medis Drips To You Bali.';

export default function ConsentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const staff = useCRMStaff();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [existing, setExisting] = useState<Consent>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  async function submit() {
    setMsg('');
    if (!name.trim()) { setMsg('Nama pasien wajib diisi.'); return; }
    if (!agree) { setMsg('Centang persetujuan terlebih dahulu.'); return; }
    setSaving(true);
    try {
      const sig = hasDrawn.current ? canvasRef.current?.toDataURL('image/png') : undefined;
      await crmSend(`/api/crm/consent/${bookingId}`, 'POST', { booking_id: bookingId, patient_name_signed: name.trim(), signature_data: sig });
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
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#205251] text-xl font-bold text-[#EAD4AE]">D</div>
          <h2 className="crm-section-title">Persetujuan Tindakan IV Therapy</h2>
          <p className="text-xs text-[#8EBFBF]">Informed Consent — Mobile IV Therapy</p>
        </div>

        {existing?.agreed_at && (
          <div className="mb-4 rounded-xl bg-[#D6EAEA] px-4 py-2 text-sm text-[#205251]">
            Sudah disetujui pada {formatDateTimeWITA(existing.agreed_at)} oleh {existing.patient_name_signed}.
          </div>
        )}

        <div className="mb-4 rounded-xl bg-[#F3F0E7] px-4 py-3 text-sm">
          <p><strong>Pasien:</strong> {booking.customer_name}</p>
          <p><strong>Layanan:</strong> {booking.product_name}</p>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-[#111a1a]">{STATEMENT}</p>

        <label className="mb-4 flex items-start gap-2 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
          <span>Saya telah membaca dan menyetujui pernyataan di atas.</span>
        </label>

        <label className="mb-1 block text-sm font-medium text-[#205251]">Nama Pasien</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4 h-12 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]" />

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-[#205251]">Tanda Tangan Digital</label>
            <button onClick={clearCanvas} type="button" className="inline-flex items-center gap-1 text-xs text-[#4d6060]"><Eraser size={14} /> Hapus</button>
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
          <p className="mt-1 text-xs text-[#8EBFBF]">Tanda tangan opsional — nama wajib diisi.</p>
        </div>

        <p className="mb-4 text-xs text-[#4d6060]">Disetujui: {formatDateTimeWITA(new Date())}</p>

        {msg && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>}

        <button onClick={submit} disabled={saving} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#205251] text-base font-semibold text-white disabled:opacity-70">
          {saving ? 'Menyimpan…' : 'Submit Consent'}
        </button>
      </div>
    </div>
  );
}
