'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { crmGet } from '@/lib/crm-client';
import { formatDate, formatDateTimeWITA } from '@/lib/crm-format';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';

type FeedbackDetail = {
  id: string;
  rating: number;
  nurse_rating: number | null;
  nurse_aspects: string[];
  comment: string | null;
  meets_expectation: 'YA' | 'TIDAK' | 'SEBAGIAN' | null;
  punctuality: 'ON_TIME' | 'SLIGHTLY_LATE' | 'VERY_LATE' | null;
  comfort_rating: number | null;
  referral_source: string | null;
  referral_source_other: string | null;
  rebook_intent: 'DEFINITELY' | 'MAYBE' | 'NOT_SURE' | 'NO' | null;
  submitted_at: string;
  booking_id: string;
  booking_code_display: string | null;
  customer_name: string;
  booking_date: string;
  product_name: string;
  sent_at: string | null;
  viewed_at: string | null;
  used_at: string | null;
  link_created_at: string | null;
  created_by_name: string | null;
};

const EXPECTATION_LABEL: Record<string, string> = {
  YA: 'Ya, sesuai ekspektasi',
  TIDAK: 'Tidak sesuai ekspektasi',
  SEBAGIAN: 'Sebagian sesuai ekspektasi',
};

const PUNCTUALITY_LABEL: Record<string, string> = {
  ON_TIME: 'Tepat waktu',
  SLIGHTLY_LATE: 'Sedikit terlambat',
  VERY_LATE: 'Terlambat lebih dari 15 menit',
};

const REFERRAL_LABEL: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  GOOGLE_SEARCH: 'Google Search',
  TIKTOK: 'TikTok',
  FACEBOOK: 'Facebook',
  HOTEL: 'Hotel',
  VILLA: 'Villa',
  FRIEND_FAMILY: 'Teman / Keluarga',
  DOCTOR_CLINIC: 'Dokter / Klinik',
  WHATSAPP: 'WhatsApp',
  OTHER: 'Lainnya',
};

const REBOOK_LABEL: Record<string, string> = {
  DEFINITELY: 'Pasti akan booking lagi',
  MAYBE: 'Mungkin',
  NOT_SURE: 'Belum yakin',
  NO: 'Tidak',
};

const ASPECT_LABEL: Record<string, string> = {
  PROFESSIONALISM: 'Profesionalisme',
  FRIENDLINESS: 'Keramahan',
  CLEAR_EXPLANATION: 'Penjelasan jelas',
  HYGIENE_CLEANLINESS: 'Kebersihan & higienitas',
  PUNCTUALITY: 'Ketepatan waktu',
};

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<FeedbackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setData(await crmGet<FeedbackDetail>(`/api/crm/feedback/${id}`));
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={error || 'Tidak ditemukan'} onRetry={load} />;

  const low = data.rating <= 2;

  return (
    <div className="crm-page mx-auto max-w-xl">
      <Link href="/crm/feedback" className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060] hover:text-[#205251]">
        <ArrowLeft size={16} /> Kembali ke daftar feedback
      </Link>

      <div className="crm-card mb-4 p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold text-[#205251]">{data.booking_code_display ?? '—'}</p>
            <p className="mt-0.5 text-lg font-semibold text-[#0f172a]">{data.customer_name}</p>
            <p className="text-sm text-[#4d6060]">{data.product_name} · {formatDate(data.booking_date)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${low ? 'bg-red-100 text-red-700' : 'bg-[#D6EAEA] text-[#205251]'}`}>
              <Star size={14} fill="currentColor" /> {data.rating}/5 Overall
            </span>
            {data.nurse_rating != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F0E7] px-3 py-1 text-xs font-bold text-[#205251]">
                <Star size={12} fill="currentColor" /> {data.nurse_rating}/5 Nurse
              </span>
            )}
          </div>
        </div>

        {data.nurse_aspects.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {data.nurse_aspects.map((a) => (
              <span key={a} className="rounded-full border border-[#D6EAEA] bg-[#F3F0E7] px-2.5 py-1 text-xs font-semibold text-[#205251]">
                {ASPECT_LABEL[a] ?? a}
              </span>
            ))}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          {data.meets_expectation && (
            <div className="rounded-xl bg-[#F3F0E7] px-3 py-2.5 text-[#4d6060]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Sesuai ekspektasi</p>
              {EXPECTATION_LABEL[data.meets_expectation] ?? data.meets_expectation}
            </div>
          )}
          {data.punctuality && (
            <div className="rounded-xl bg-[#F3F0E7] px-3 py-2.5 text-[#4d6060]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Ketepatan waktu</p>
              {PUNCTUALITY_LABEL[data.punctuality] ?? data.punctuality}
            </div>
          )}
          {data.comfort_rating != null && (
            <div className="rounded-xl bg-[#F3F0E7] px-3 py-2.5 text-[#4d6060]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Kenyamanan</p>
              <span className="inline-flex items-center gap-1"><Star size={12} fill="currentColor" className="text-[#C9944C]" /> {data.comfort_rating}/5</span>
            </div>
          )}
          {data.rebook_intent && (
            <div className="rounded-xl bg-[#F3F0E7] px-3 py-2.5 text-[#4d6060]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Mau booking lagi?</p>
              {REBOOK_LABEL[data.rebook_intent] ?? data.rebook_intent}
            </div>
          )}
          {data.referral_source && (
            <div className="col-span-2 rounded-xl bg-[#F3F0E7] px-3 py-2.5 text-[#4d6060]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Tahu Drips To You dari</p>
              {REFERRAL_LABEL[data.referral_source] ?? data.referral_source}
              {data.referral_source === 'OTHER' && data.referral_source_other ? ` — ${data.referral_source_other}` : ''}
            </div>
          )}
        </div>

        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Komentar Tambahan</div>
        <p className="whitespace-pre-wrap rounded-xl border border-[#DBDAD7] bg-white p-4 text-sm text-[#111a1a]">
          {data.comment || <span className="text-[#8EBFBF]">Tidak ada komentar.</span>}
        </p>

        <p className="mt-4 text-xs text-[#8EBFBF]">Diisi {formatDateTimeWITA(data.submitted_at)}</p>
      </div>

      <div className="crm-card p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Riwayat Link</p>
        <div className="space-y-2 text-sm">
          <Row label="Dibuat oleh" value={data.created_by_name ?? '—'} />
          <Row label="Dibuat" value={data.link_created_at ? formatDateTimeWITA(data.link_created_at) : '—'} />
          <Row label="Terkirim" value={data.sent_at ? formatDateTimeWITA(data.sent_at) : '—'} />
          <Row label="Dibuka" value={data.viewed_at ? formatDateTimeWITA(data.viewed_at) : '—'} />
          <Row label="Diisi" value={data.used_at ? formatDateTimeWITA(data.used_at) : '—'} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#4d6060]">{label}</span>
      <span className="text-right text-[#111a1a]">{value}</span>
    </div>
  );
}
