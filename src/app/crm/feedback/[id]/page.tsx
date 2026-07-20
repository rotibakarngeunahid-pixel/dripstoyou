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
  comment: string | null;
  meets_expectation: 'YA' | 'TIDAK' | 'SEBAGIAN' | null;
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
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${low ? 'bg-red-100 text-red-700' : 'bg-[#D6EAEA] text-[#205251]'}`}>
            <Star size={14} fill="currentColor" /> {data.rating}/5
          </span>
        </div>

        {data.meets_expectation && (
          <div className="mb-4 rounded-xl bg-[#F3F0E7] px-4 py-2.5 text-sm text-[#4d6060]">
            <strong className="text-[#205251]">Sesuai ekspektasi:</strong> {EXPECTATION_LABEL[data.meets_expectation] ?? data.meets_expectation}
          </div>
        )}

        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">Komentar</div>
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
