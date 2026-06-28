'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { crmGet } from '@/lib/crm-client';
import { formatRupiah, formatDate, initials } from '@/lib/crm-format';
import StatusBadge from '@/components/crm/StatusBadge';
import { LoadingBlock, ErrorBlock, EmptyState } from '@/components/crm/states';
import { PatientModal } from '../page';

type Booking = { id: string; booking_code_display: string | null; booking_date: string; booking_time: string; crm_status: string; total_fee: string | null; product_name: string; nurse_name: string | null };
type Treatment = { id: string; completed_at: string | null; patient_condition_after: string | null; follow_up_recommendation: string | null; booking_code_display: string | null; booking_date: string; product_name: string; nurse_name: string | null };
type Detail = {
  id: string; name: string; phone: string; email: string | null; address: string | null; special_notes: string | null;
  area_name: string | null; nationality: string | null; dob: string | null; booking_count: number; total_spend: string | null;
  is_repeat: boolean; created_at: string; area_id: string | null; bookings: Booking[]; treatments: Treatment[];
};

const TABS = ['Overview', 'Booking', 'Treatment', 'Catatan'] as const;
type Tab = typeof TABS[number];

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('Overview');
  const [edit, setEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setP(await crmGet<Detail>(`/api/crm/patient/${encodeURIComponent(id)}`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat pasien'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !p) return <ErrorBlock message={error || 'Tidak ditemukan'} onRetry={load} />;

  return (
    <div>
      <Link href="/crm/pasien" className="mb-4 inline-flex items-center gap-1 text-sm text-[#4d6060] hover:text-[#205251]">
        <ArrowLeft size={16} /> Kembali ke daftar pasien
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#DBDAD7] bg-white p-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D6EAEA] text-xl font-semibold text-[#205251]">{initials(p.name)}</span>
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl text-[#205251]">
              {p.name}
              {p.is_repeat && <span className="rounded-full bg-[#C9944C] px-2 py-0.5 text-[10px] font-medium text-white">REPEAT · {p.booking_count}x</span>}
            </h2>
            <p className="text-sm text-[#4d6060]">{p.phone} · {p.area_name ?? 'Tanpa area'}</p>
            <p className="text-xs text-[#8EBFBF]">Pasien sejak {formatDate(p.created_at)} · Total {formatRupiah(p.total_spend)}</p>
          </div>
        </div>
        <button onClick={() => setEdit(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DBDAD7] px-3 text-sm font-medium text-[#205251]">
          <Pencil size={16} /> Edit
        </button>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${tab === t ? 'bg-[#205251] text-white' : 'text-[#4d6060]'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Kontak & Alamat">
            <Row label="Telepon" value={p.phone} />
            <Row label="Email" value={p.email ?? '—'} />
            <Row label="Tgl Lahir" value={p.dob ? formatDate(p.dob) : '—'} />
            <Row label="Kewarganegaraan" value={p.nationality ?? '—'} />
            <Row label="Alamat" value={p.address ?? '—'} />
          </Card>
          <Card title="Catatan Khusus">
            <p className="text-sm text-[#111a1a]">{p.special_notes || 'Tidak ada catatan khusus.'}</p>
          </Card>
          <div className="md:col-span-2">
            <Card title="Treatment Terakhir">
              {p.treatments.length === 0 ? <p className="text-sm text-[#8EBFBF]">Belum ada treatment.</p> : (
                <ul className="space-y-2">
                  {p.treatments.slice(0, 4).map((t) => (
                    <li key={t.id} className="flex justify-between border-b border-[#F3F0E7] pb-2 text-sm last:border-0">
                      <span>{t.product_name} <span className="text-xs text-[#8EBFBF]">· {t.nurse_name ?? '—'}</span></span>
                      <span className="text-[#4d6060]">{t.completed_at ? formatDate(t.completed_at) : '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'Booking' && (
        p.bookings.length === 0 ? <EmptyState title="Belum ada booking" /> : (
          <div className="space-y-2">
            {p.bookings.map((b) => (
              <Link key={b.id} href={`/crm/booking/${b.booking_code_display ?? b.id}`} className="flex items-center justify-between rounded-2xl border border-[#DBDAD7] bg-white p-3">
                <div>
                  <p className="font-medium text-[#205251]">{b.booking_code_display ?? '—'} · {b.product_name}</p>
                  <p className="text-xs text-[#4d6060]">{formatDate(b.booking_date)} {b.booking_time} · {b.nurse_name ?? 'Tanpa nurse'}</p>
                </div>
                <StatusBadge status={b.crm_status} />
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'Treatment' && (
        p.treatments.length === 0 ? <EmptyState title="Belum ada treatment" /> : (
          <div className="space-y-2">
            {p.treatments.map((t) => (
              <div key={t.id} className="rounded-2xl border border-[#DBDAD7] bg-white p-3 text-sm">
                <div className="flex justify-between">
                  <p className="font-medium text-[#205251]">{t.product_name}</p>
                  <span className="text-[#4d6060]">{t.completed_at ? formatDate(t.completed_at) : '—'}</span>
                </div>
                <p className="text-xs text-[#8EBFBF]">Nurse: {t.nurse_name ?? '—'} · {t.booking_code_display ?? ''}</p>
                {t.patient_condition_after && <p className="mt-1 text-[#4d6060]">Kondisi: {t.patient_condition_after}</p>}
                {t.follow_up_recommendation && <p className="text-[#4d6060]">Follow-up: {t.follow_up_recommendation}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'Catatan' && (
        <Card title="Catatan Khusus Pasien">
          <p className="mb-3 text-sm text-[#111a1a]">{p.special_notes || 'Belum ada catatan.'}</p>
          <button onClick={() => setEdit(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DBDAD7] px-3 text-sm font-medium text-[#205251]">
            <Pencil size={16} /> Edit catatan
          </button>
        </Card>
      )}

      {edit && (
        <PatientModal
          initial={{ id: p.id, name: p.name, phone: p.phone, email: p.email, dob: p.dob, address: p.address, area_id: p.area_id, nationality: p.nationality, special_notes: p.special_notes }}
          onClose={() => setEdit(false)}
          onSaved={() => { setEdit(false); load(); }}
        />
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#DBDAD7] bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8EBFBF]">{title}</p>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-[#4d6060]">{label}</span>
      <span className="text-right text-[#111a1a]">{value}</span>
    </div>
  );
}
