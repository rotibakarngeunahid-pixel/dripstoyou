'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, MessageCircle, ShieldAlert, Star } from 'lucide-react';
import { waGeneralUrl } from '@/lib/whatsapp';
import { Spinner } from '@/components/crm/states';

type Booking = { booking_code_display: string | null; customer_name: string; product_name: string; booking_date: string };
type Feedback = { rating: number; submitted_at: string } | null;

async function readEnvelope(res: Response) {
  try { return await res.json(); } catch { return { success: false, message: 'Respons server tidak valid' }; }
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

const EXPECTATION_OPTIONS: { value: 'YA' | 'TIDAK' | 'SEBAGIAN'; label: string }[] = [
  { value: 'YA', label: 'Ya, sesuai' },
  { value: 'SEBAGIAN', label: 'Sebagian' },
  { value: 'TIDAK', label: 'Tidak sesuai' },
];

export default function PublicFeedbackPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [existing, setExisting] = useState<Feedback>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [expectation, setExpectation] = useState<'YA' | 'TIDAK' | 'SEBAGIAN' | ''>('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setNotFound('');
    try {
      const res = await fetch(`/api/feedback/${token}`, { cache: 'no-store' });
      const json = await readEnvelope(res);
      if (!res.ok || json.success === false) {
        setNotFound(json.message ?? 'Link tidak valid atau sudah kadaluarsa.');
        return;
      }
      setBooking(json.data.booking);
      setExisting(json.data.feedback ?? null);
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

  async function submit() {
    setMsg('');
    if (rating < 1) { setMsg('Mohon pilih rating bintang.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/feedback/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined, meets_expectation: expectation || undefined }),
      });
      const json = await readEnvelope(res);
      if (!res.ok || json.success === false) throw new Error(json.message ?? 'Gagal menyimpan feedback');
      setDone(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal menyimpan');
      setSaving(false);
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
            href={waGeneralUrl('Halo, link feedback saya sepertinya sudah tidak berlaku. Mohon bantuannya.')}
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
          <p className="mx-auto max-w-sm text-sm text-[#4d6060]">
            Feedback Anda sudah kami terima. Masukan Anda sangat berarti untuk meningkatkan layanan kami.
          </p>
        </div>
      </Shell>
    );
  }

  // Sudah pernah diisi sebelumnya — link publik tidak pernah menimpa feedback yang sudah final.
  if (existing) {
    return (
      <Shell>
        <Brand />
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]"><CheckCircle2 size={24} /></span>
          <h2 className="crm-section-title mb-1">Feedback Sudah Diisi</h2>
          <p className="mx-auto max-w-sm text-sm text-[#4d6060]">
            Anda sudah mengisi feedback untuk kunjungan ini. Terima kasih atas waktunya!
          </p>
        </div>
      </Shell>
    );
  }

  const activeStars = hoverRating || rating;

  return (
    <Shell>
      <Brand />
      <div className="crm-card p-6">
        <div className="mb-5 text-center">
          <h2 className="crm-section-title">Bagaimana Pengalaman Anda?</h2>
          <p className="text-xs text-[#8EBFBF]">Ceritakan pengalaman treatment Anda bersama kami</p>
        </div>

        <div className="mb-4 rounded-xl bg-[#F3F0E7] px-4 py-3 text-sm">
          <p><strong>Pasien:</strong> {booking.customer_name}</p>
          <p><strong>Layanan:</strong> {booking.product_name}</p>
        </div>

        <label className="mb-2 block text-center text-sm font-medium text-[#205251]">Rating</label>
        <div className="mb-5 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${n} bintang`}
              className="p-1"
            >
              <Star size={36} className={n <= activeStars ? 'fill-[#C9944C] text-[#C9944C]' : 'fill-none text-[#DBDAD7]'} />
            </button>
          ))}
        </div>

        <label className="mb-2 block text-sm font-medium text-[#205251]">Apakah hasilnya sesuai ekspektasi? (opsional)</label>
        <div className="mb-4 flex gap-2">
          {EXPECTATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExpectation((v) => (v === opt.value ? '' : opt.value))}
              className={`h-10 flex-1 rounded-xl border text-xs font-semibold transition ${
                expectation === opt.value ? 'border-[#205251] bg-[#205251] text-white' : 'border-[#DBDAD7] bg-white text-[#4d6060]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm font-medium text-[#205251]">Komentar (opsional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          placeholder="Ceritakan pengalaman Anda…"
          className="mb-4 min-h-[100px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]"
        />

        {msg && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>}

        <button onClick={submit} disabled={saving} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#205251] text-base font-semibold text-white disabled:opacity-70">
          {saving ? 'Mengirim…' : 'Kirim Feedback'}
        </button>
      </div>
    </Shell>
  );
}
