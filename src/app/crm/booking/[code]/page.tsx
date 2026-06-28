'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, RefreshCw, Stethoscope, UserPlus, ClipboardCheck, FileSignature, Syringe } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatRupiah, formatDateTimeWITA } from '@/lib/crm-format';
import { STATUS_LABEL, STATUS_RANK, TIMELINE_STEPS, nextStatuses, type CRMBookingStatus } from '@/lib/crm-status';
import { generateWALink } from '@/lib/crm-whatsapp';
import StatusBadge from '@/components/crm/StatusBadge';
import Modal from '@/components/crm/Modal';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';
import { useCRMStaff } from '../../CRMShell';

type Detail = {
  id: string;
  booking_code_display: string | null;
  customer_name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  booking_date: string;
  booking_time: string;
  people_count: number;
  location_type: string;
  crm_status: CRMBookingStatus;
  service_fee: string | null;
  visit_fee: string | null;
  total_fee: string | null;
  product_name: string;
  service_area_name: string | null;
  patient: { id: string; name: string; is_repeat: boolean; booking_count: number } | null;
  nurse: { id: string; name: string } | null;
  screening: { id: string; conclusion: string; submitted_at: string | null } | null;
  consent: { id: string; agreed_at: string | null } | null;
  treatment: { id: string; completed_at: string | null } | null;
  payment: { paid: number; dp: number; count: number; total: number };
};

export default function BookingDetailPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const staff = useCRMStaff();
  const isNurse = staff?.role === 'NURSE';

  const [b, setB] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setB(await crmGet<Detail>(`/api/crm/booking/${encodeURIComponent(code)}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat booking');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <LoadingBlock />;
  if (error || !b) return <ErrorBlock message={error || 'Tidak ditemukan'} onRetry={load} />;

  const rank = STATUS_RANK[b.crm_status] ?? 0;
  const remaining = Math.max(0, b.payment.total - b.payment.paid);

  function waLink() {
    if (!b) return '#';
    const msg = `Halo ${b.customer_name}, terkait booking ${b.booking_code_display ?? ''} (${b.product_name}) pada ${formatDateTimeWITA(`${b.booking_date} ${b.booking_time}`)}.`;
    return generateWALink(b.phone, msg);
  }

  const stepTime: Partial<Record<CRMBookingStatus, string | null>> = {
    SCREENING_COMPLETED: b.screening?.submitted_at ?? null,
    CONSENT_SIGNED: b.consent?.agreed_at ?? null,
    TREATMENT_COMPLETED: b.treatment?.completed_at ?? null,
  };

  return (
    <div>
      <Link href="/crm/booking" className="mb-4 inline-flex items-center gap-1 text-sm text-[#4d6060] hover:text-[#205251]">
        <ArrowLeft size={16} /> Kembali ke daftar booking
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#205251]">{b.booking_code_display ?? 'Booking'}</h2>
          <div className="mt-1"><StatusBadge status={b.crm_status} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={waLink()} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-medium text-white">
            <MessageCircle size={16} /> WhatsApp
          </a>
          {!isNurse && (
            <>
              <button onClick={() => setShowAssign(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DBDAD7] bg-white px-3 text-sm font-medium text-[#205251]">
                <UserPlus size={16} /> Assign Nurse
              </button>
              <button onClick={() => setShowStatus(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#205251] px-3 text-sm font-medium text-white">
                <RefreshCw size={16} /> Update Status
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: info */}
        <div className="space-y-4">
          <Card title="Pasien">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#205251]">{b.customer_name}</p>
                <p className="text-sm text-[#4d6060]">{b.phone}</p>
              </div>
              {b.patient?.is_repeat && <span className="rounded-full bg-[#C9944C] px-2.5 py-1 text-xs font-medium text-white">REPEAT · {b.patient.booking_count}x</span>}
            </div>
            {b.patient && <Link href={`/crm/pasien/${b.patient.id}`} className="mt-2 inline-block text-sm text-[#29808B] hover:underline">Lihat profil pasien →</Link>}
          </Card>

          <Card title="Layanan & Biaya">
            <Row label="Layanan" value={b.product_name} />
            <Row label="Biaya layanan" value={formatRupiah(b.service_fee)} />
            <Row label="Visit fee" value={formatRupiah(b.visit_fee)} />
            <div className="mt-2 flex justify-between border-t border-[#DBDAD7] pt-2 font-semibold text-[#205251]">
              <span>Total</span><span>{formatRupiah(b.total_fee)}</span>
            </div>
          </Card>

          <Card title="Jadwal & Lokasi">
            <Row label="Tanggal" value={formatDateTimeWITA(`${b.booking_date} ${b.booking_time}`)} />
            <Row label="Tipe lokasi" value={b.location_type} />
            <Row label="Area" value={b.service_area_name ?? '—'} />
            <Row label="Alamat" value={b.address ?? '—'} />
            {b.notes && <Row label="Catatan" value={b.notes} />}
          </Card>

          <Card title="Nurse">
            {b.nurse ? <p className="text-sm">{b.nurse.name}</p> : <p className="text-sm text-[#8EBFBF]">Belum ada nurse ditugaskan</p>}
          </Card>

          <Card title="Pembayaran">
            <Row label="Dibayar" value={formatRupiah(b.payment.paid)} />
            {b.payment.dp > 0 && <Row label="DP" value={formatRupiah(b.payment.dp)} />}
            <Row label="Sisa" value={formatRupiah(remaining)} />
          </Card>

          {/* Clinical quick links */}
          <div className="grid grid-cols-3 gap-2">
            <ClinicalLink href={`/crm/screening/${b.id}`} icon={Stethoscope} label="Screening" done={!!b.screening?.submitted_at} />
            <ClinicalLink href={`/crm/consent/${b.id}`} icon={FileSignature} label="Consent" done={!!b.consent} />
            <ClinicalLink href={`/crm/treatment/${b.id}`} icon={Syringe} label="Treatment" done={!!b.treatment?.completed_at} />
          </div>
        </div>

        {/* Right: timeline */}
        <Card title="Timeline">
          <ol className="relative ml-2 border-l-2 border-[#DBDAD7]">
            {TIMELINE_STEPS.map((step) => {
              const reached = rank >= (STATUS_RANK[step] ?? 99);
              const active = b.crm_status === step;
              return (
                <li key={step} className="mb-5 ml-4">
                  <span
                    className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      reached ? 'border-[#205251] bg-[#205251]' : 'border-[#DBDAD7] bg-white'
                    } ${active ? 'ring-4 ring-[#D6EAEA]' : ''}`}
                  />
                  <p className={`text-sm ${reached ? 'font-medium text-[#205251]' : 'text-[#8EBFBF]'}`}>{STATUS_LABEL[step]}</p>
                  {stepTime[step] && <p className="text-xs text-[#4d6060]">{formatDateTimeWITA(stepTime[step]!)}</p>}
                  {step === 'SCREENING_COMPLETED' && b.screening?.conclusion && (
                    <p className="text-xs text-[#29808B]">Kesimpulan: {b.screening.conclusion}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      {showStatus && (
        <StatusModal current={b.crm_status} bookingId={b.id} code={code} onClose={() => setShowStatus(false)} onDone={() => { setShowStatus(false); load(); }} />
      )}
      {showAssign && (
        <AssignModal bookingId={b.id} onClose={() => setShowAssign(false)} onDone={() => { setShowAssign(false); load(); }} />
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
function ClinicalLink({ href, icon: Icon, label, done }: { href: string; icon: typeof Stethoscope; label: string; done: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center text-xs ${done ? 'border-[#205251] bg-[#D6EAEA] text-[#205251]' : 'border-[#DBDAD7] text-[#4d6060]'}`}>
      <Icon size={20} />
      <span>{label}</span>
      {done && <ClipboardCheck size={12} className="text-[#205251]" />}
    </Link>
  );
}

function StatusModal({ current, bookingId, code, onClose, onDone }: { current: CRMBookingStatus; bookingId: string; code: string; onClose: () => void; onDone: () => void }) {
  const options = nextStatuses(current);
  const [status, setStatus] = useState<string>(options[0] ?? '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!status) return;
    setSaving(true); setErr('');
    try {
      await crmSend(`/api/crm/booking/${encodeURIComponent(code)}?id=${encodeURIComponent(bookingId)}`, 'PATCH', { status, note });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Update Status" footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving || !status} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    }>
      {options.length === 0 ? (
        <p className="text-sm text-[#4d6060]">Status ini sudah final — tidak ada transisi berikutnya.</p>
      ) : (
        <div className="space-y-3">
          {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <label className="block text-sm">Status baru
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-xl border border-[#DBDAD7] px-3 text-base outline-none focus:border-[#29808B]">
              {options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="block text-sm">Catatan (opsional)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px] w-full rounded-xl border border-[#DBDAD7] p-3 text-base outline-none focus:border-[#29808B]" />
          </label>
        </div>
      )}
    </Modal>
  );
}

function AssignModal({ bookingId, onClose, onDone }: { bookingId: string; onClose: () => void; onDone: () => void }) {
  const [nurses, setNurses] = useState<{ id: string; name: string; today_count: number }[]>([]);
  const [nurseId, setNurseId] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    crmGet<{ items: { id: string; name: string; today_count: number }[] }>('/api/crm/nurse').then((d) => setNurses(d.items ?? [])).catch(() => setNurses([]));
  }, []);

  async function submit() {
    if (!nurseId) return;
    setSaving(true); setErr('');
    try {
      await crmSend('/api/crm/nurse', 'POST', { action: 'assign', booking_id: bookingId, nurse_id: nurseId });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Assign Nurse" footer={
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-11 rounded-xl border border-[#DBDAD7] px-4 text-sm">Batal</button>
        <button onClick={submit} disabled={saving || !nurseId} className="h-11 rounded-xl bg-[#205251] px-5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Menyimpan…' : 'Tugaskan'}</button>
      </div>
    }>
      <div className="space-y-2">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        {nurses.length === 0 && <p className="text-sm text-[#8EBFBF]">Belum ada nurse aktif.</p>}
        {nurses.map((n) => (
          <button
            key={n.id}
            onClick={() => setNurseId(n.id)}
            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${nurseId === n.id ? 'border-[#205251] bg-[#D6EAEA]' : 'border-[#DBDAD7]'}`}
          >
            <span className="font-medium text-[#205251]">{n.name}</span>
            <span className="text-xs text-[#4d6060]">{n.today_count} booking hari ini</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
