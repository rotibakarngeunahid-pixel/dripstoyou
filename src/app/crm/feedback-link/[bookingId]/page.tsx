'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Copy, ExternalLink, Link2, Star, Syringe, XCircle } from 'lucide-react';
import { crmGet, crmSend } from '@/lib/crm-client';
import { formatDateTimeWITA } from '@/lib/crm-format';
import { crmBookingHref } from '@/lib/crm-permissions';
import { STATUS_RANK, type CRMBookingStatus } from '@/lib/crm-status';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { LoadingBlock, ErrorBlock } from '@/components/crm/states';
import { useCRMStaff } from '../../CRMShell';

type Booking = {
  id: string; booking_code_display: string | null; customer_name: string; phone: string | null;
  product_name: string; crm_status: string;
};
type LinkStatus = {
  expires_at: string; sent_at: string | null; viewed_at: string | null; used_at: string | null; created_at: string;
} | null;

export default function FeedbackLinkPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const staff = useCRMStaff();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [linkStatus, setLinkStatus] = useState<LinkStatus>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const loadLinkStatus = useCallback(async () => {
    try {
      const d = await crmGet<{ active: LinkStatus }>(`/api/crm/feedback-link/${bookingId}`);
      setLinkStatus(d.active ?? null);
    } catch { /* non-critical — panel just shows "no active link" */ }
  }, [bookingId]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Reuses the consent endpoint purely for its booking summary (id,
      // customer_name, phone, product_name, crm_status) — it's gated on the
      // 'consent' module, which NURSE has, unlike 'booking' (global list/detail,
      // OWNER+ADMIN only). NURSE needs to reach this page straight from the
      // treatment-completion screen without ever touching /crm/booking/[code].
      const d = await crmGet<{ booking: Booking }>(`/api/crm/consent/${bookingId}`);
      setBooking(d.booking);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); void loadLinkStatus(); }, 0);
    return () => clearTimeout(t);
  }, [load, loadLinkStatus]);

  async function generateLink() {
    setLinkMsg(''); setLinkBusy(true); setCopied(false);
    try {
      const res = await crmSend<{ token: string; expiresAt: string }>(`/api/crm/feedback-link/${bookingId}`, 'POST', {});
      const url = `${window.location.origin}/feedback/${res.data?.token}`;
      setLinkUrl(url);
      await loadLinkStatus();
    } catch (e) { setLinkMsg(e instanceof Error ? e.message : 'Gagal membuat link'); }
    finally { setLinkBusy(false); }
  }

  async function revokeLink() {
    setLinkMsg(''); setLinkBusy(true);
    try {
      await crmSend(`/api/crm/feedback-link/${bookingId}`, 'POST', { action: 'revoke' });
      setLinkUrl('');
      await loadLinkStatus();
    } catch (e) { setLinkMsg(e instanceof Error ? e.message : 'Gagal mencabut link'); }
    finally { setLinkBusy(false); }
  }

  async function markSent() {
    try { await crmSend(`/api/crm/feedback-link/${bookingId}`, 'POST', { action: 'mark_sent' }); }
    catch { /* non-critical — link still works even if the marker fails */ }
    void loadLinkStatus();
  }

  async function copyLink() {
    if (!linkUrl) return;
    void markSent();
    try { await navigator.clipboard.writeText(linkUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { setLinkMsg('Gagal menyalin link'); }
  }

  if (loading) return <LoadingBlock />;
  if (error || !booking) return <ErrorBlock message={error || 'Tidak ditemukan'} onRetry={load} />;

  const backHref = crmBookingHref(staff, booking.booking_code_display ?? bookingId);
  const treatmentDone = (STATUS_RANK[booking.crm_status as CRMBookingStatus] ?? 0) >= STATUS_RANK.TREATMENT_COMPLETED;
  const waMessage = `Halo ${booking.customer_name}, terima kasih sudah treatment ${booking.product_name} bersama Drips To You - Bali 🌿\n\nBoleh minta waktu sebentar untuk kasih feedback lewat link berikut:\n${linkUrl}\n\nLink berlaku 7 hari. Terima kasih!`;

  if (!treatmentDone) {
    return (
      <div className="crm-page mx-auto max-w-xl">
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]"><ArrowLeft size={16} /> Kembali</Link>
        <div className="crm-card p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F0E7] text-[#C9944C]"><Syringe size={24} /></span>
          <h2 className="crm-section-title mb-1">Treatment Belum Selesai</h2>
          <p className="mx-auto mb-4 max-w-sm text-sm text-[#4d6060]">
            Link feedback hanya bisa dikirim setelah treatment ditandai selesai.
          </p>
          <Link href={`/crm/treatment/${bookingId}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-[#205251] px-6 text-sm font-semibold text-white">
            Buka Treatment →
          </Link>
        </div>
      </div>
    );
  }

  const status = linkStatusLabel(linkStatus);

  return (
    <div className="crm-page mx-auto max-w-xl">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-[#4d6060]"><ArrowLeft size={16} /> Kembali</Link>

      <div className="crm-card p-6">
        <div className="mb-5 text-center">
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]"><Star size={24} /></span>
          <h2 className="crm-section-title">Link Feedback</h2>
          <p className="text-xs text-[#8EBFBF]">{booking.customer_name} · {booking.product_name}</p>
        </div>

        {status && (
          <div className={`mb-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${status.className}`}>
            {status.icon} {status.label}
            {linkStatus?.used_at && (
              <span className="font-normal text-[#4d6060]">· {formatDateTimeWITA(linkStatus.used_at)}</span>
            )}
          </div>
        )}

        {linkStatus?.used_at ? (
          <div className="rounded-xl bg-[#F3F0E7] px-4 py-3 text-center text-sm text-[#4d6060]">
            Pasien sudah mengisi feedback untuk kunjungan ini. Lihat isinya di{' '}
            <Link href="/crm/feedback" className="font-semibold text-[#29808B] hover:underline">daftar feedback →</Link>
          </div>
        ) : linkUrl ? (
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
                onClick={() => { if (booking.phone) void markSent(); }}
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
          <button onClick={generateLink} disabled={linkBusy} type="button" className="crm-button flex w-full items-center justify-center gap-2 py-2.5 text-sm">
            <Link2 size={16} /> {linkBusy ? 'Membuat link…' : linkStatus ? 'Buat Link Baru' : 'Buat Link Feedback'}
          </button>
        )}

        {linkMsg && <p className="mt-2 text-xs text-red-600">{linkMsg}</p>}
      </div>
    </div>
  );
}

function linkStatusLabel(s: LinkStatus): { label: string; className: string; icon: React.ReactNode } | null {
  if (!s) return null;
  if (s.used_at) return { label: 'Sudah Diisi', className: 'bg-[#D6EAEA] text-[#205251]', icon: <CheckCircle2 size={16} /> };
  if (s.viewed_at) return { label: 'Sudah Dibuka', className: 'bg-blue-50 text-blue-700', icon: <ExternalLink size={16} /> };
  if (s.sent_at) return { label: 'Terkirim', className: 'bg-amber-50 text-amber-700', icon: <Link2 size={16} /> };
  return { label: 'Belum Dikirim', className: 'bg-[#F3F0E7] text-[#4d6060]', icon: <Link2 size={16} /> };
}
