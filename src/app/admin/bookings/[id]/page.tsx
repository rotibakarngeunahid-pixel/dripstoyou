'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  User,
  ClipboardList,
  Check,
  Activity,
  Phone,
  Map,
  StickyNote,
  Users,
  Navigation,
  Globe,
  CalendarDays,
  RefreshCcw,
  History,
  Hash,
} from 'lucide-react';

/* ─── Status config (color/bg only) ─── */
const STATUS_THEME: Record<string, { color: string; bg: string }> = {
  BARU:       { color: '#b8833e', bg: '#fdf8f3' },
  KONFIRMASI: { color: '#276f73', bg: '#f0f7f7' },
  DIPROSES:   { color: '#5e9c98', bg: '#f2f8f8' },
  SELESAI:    { color: '#1b8f4d', bg: '#f0fdf4' },
  DIBATALKAN: { color: '#c0392b', bg: '#fef2f2' },
};

const STATUS_VALUES = ['BARU', 'KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN'] as const;

/* ─── Types ─── */
type ApiResponse<T> = { success?: boolean; message?: string; data?: T; error?: string };

type StatusHistory = {
  old_status: string;
  new_status: string;
  note: string | null;
  created_at: string;
  changed_by_name: string | null;
};

type Booking = {
  id: string;
  booking_code: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  booking_date: string;
  booking_time: string;
  people_count: number;
  location_type: string;
  status: string;
  source: string;
  created_at: string;
  product_name: string;
  price_label: string | null;
  service_area_name: string | null;
  statusHistory: StatusHistory[];
};

/* ─── InfoRow sub-component ─── */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bd-info-row">
      <div className="bd-info-icon"><Icon size={14} /></div>
      <div className="bd-info-label">{label}</div>
      <div className="bd-info-sep">:</div>
      <div className="bd-info-val">{value}</div>
    </div>
  );
}

/* ─── Page ─── */
export default function BookingDetailPage() {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [booking,       setBooking]       = useState<Booking | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [newStatus,     setNewStatus]     = useState('');
  const [note,          setNote]          = useState('');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [confirmStatus, setConfirmStatus] = useState(false);

  const sLabel = (s: string) => (t[`status${s}` as keyof typeof t] as string | undefined) ?? s;
  const fmtDateTime = (v: string) =>
    new Date(v).toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID');

  async function loadBooking() {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/admin/bookings/${id}`, { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<Booking>;
      if (!res.ok) { setBooking(null); setError(json.message ?? json.error ?? t.gagalMemuatBooking); return; }
      setBooking(json.data ?? null);
      setNewStatus(json.data?.status ?? '');
    } catch {
      setError(t.gagalMemuatBooking);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { void loadBooking(); }, [id]);

  function requestStatusUpdate() {
    if (!booking || newStatus === booking.status) return;
    setConfirmStatus(true);
  }

  async function updateStatus() {
    if (!booking || newStatus === booking.status) return;
    setSaving(true); setError(''); setSuccessMsg('');
    try {
      const res  = await fetch(`/api/admin/bookings/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as ApiResponse<{ status: string }>;
      if (!res.ok) { setError(json.message ?? json.error ?? t.gagalMenyimpan); return; }
      setBooking((cur) => (cur ? { ...cur, status: json.data?.status ?? newStatus } : cur));
      setNote('');
      setConfirmStatus(false);
      setSuccessMsg(t.berhasilDisimpan);
      setTimeout(() => setSuccessMsg(''), 3500);
      await loadBooking();
      void fetch('/api/admin/bookings', { cache: 'no-store' }).catch(() => {});
    } catch {
      setError(t.koneksiFailed);
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="admin-page">
        <div className="skeleton-line" style={{ width: 140, height: 32, marginBottom: 24 }} />
        <div className="skeleton-line" style={{ width: 280, height: 44, marginBottom: 24 }} />
        <div className="bd-summary-grid" style={{ marginBottom: 20 }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton-block" style={{ height: 80, borderRadius: 16 }} />
          ))}
        </div>
        <div className="bd-main-grid">
          <div className="skeleton-block" style={{ height: 280, borderRadius: 18 }} />
          <div className="skeleton-block" style={{ height: 280, borderRadius: 18 }} />
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (!booking) {
    return (
      <div className="admin-page">
        <div className="bd-alert bd-alert-error">{error || t.bookingTidakDitemukan}</div>
      </div>
    );
  }

  /* ── Derived values ── */
  const theme     = STATUS_THEME[booking.status] ?? { color: '#667676', bg: '#f5f5f5' };
  const locale    = lang === 'en' ? 'en-GB' : 'id-ID';
  const longDate  = new Date(booking.booking_date).toLocaleDateString(locale, {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const shortDate = new Date(booking.booking_date).toLocaleDateString(locale, {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const confirmMsg = lang === 'id'
    ? `Status booking ${booking.booking_code} akan diubah dari "${sLabel(booking.status)}" menjadi "${sLabel(newStatus)}".`
    : `Booking ${booking.booking_code} status will change from "${sLabel(booking.status)}" to "${sLabel(newStatus)}".`;

  return (
    <div className="admin-page">
      {/* Confirm modal */}
      <ConfirmModal
        open={confirmStatus}
        title={t.ubahStatusTitle}
        message={confirmMsg}
        confirmLabel={t.simpanStatusBtn}
        loadingLabel={t.menyimpan}
        loading={saving}
        danger={newStatus === 'DIBATALKAN'}
        onConfirm={updateStatus}
        onCancel={() => setConfirmStatus(false)}
      />

      {/* ── Back button ── */}
      <button className="bd-back-btn" type="button" onClick={() => router.back()}>
        <ArrowLeft size={15} />
        {t.kembali}
      </button>

      {/* ── Header ── */}
      <div className="bd-header">
        <h1 className="bd-code">{booking.booking_code}</h1>
        <span className="bd-status-badge" style={{ color: theme.color, background: theme.bg }}>
          {sLabel(booking.status)}
        </span>
      </div>

      {/* ── Summary cards ── */}
      <div className="bd-summary-grid">
        <div className="bd-summary-card">
          <div className="bd-summary-icon"><Activity size={18} /></div>
          <div className="bd-summary-text">
            <span className="bd-summary-label">Treatment</span>
            <span className="bd-summary-value">{booking.product_name}</span>
          </div>
        </div>
        <div className="bd-summary-card">
          <div className="bd-summary-icon"><CalendarDays size={18} /></div>
          <div className="bd-summary-text">
            <span className="bd-summary-label">{t.tanggalLabel}</span>
            <span className="bd-summary-value">{shortDate}</span>
          </div>
        </div>
        <div className="bd-summary-card">
          <div className="bd-summary-icon"><Clock size={18} /></div>
          <div className="bd-summary-text">
            <span className="bd-summary-label">{t.waktuLabel}</span>
            <span className="bd-summary-value">{booking.booking_time}</span>
          </div>
        </div>
        <div className="bd-summary-card">
          <div className="bd-summary-icon"><MapPin size={18} /></div>
          <div className="bd-summary-text">
            <span className="bd-summary-label">{t.areaLabel}</span>
            <span className="bd-summary-value">{booking.service_area_name ?? '-'}</span>
          </div>
        </div>
      </div>

      {/* ── 2-col info grid ── */}
      <div className="bd-main-grid">
        {/* Info Pelanggan */}
        <div className="bd-card">
          <div className="bd-card-head">
            <div className="bd-card-icon"><User size={17} /></div>
            <div className="bd-card-title">{t.infoPelanggan}</div>
          </div>
          <InfoRow icon={User}      label={t.namaLabel}   value={booking.customer_name} />
          <InfoRow icon={Phone}     label={t.hpLabel}     value={booking.phone} />
          <InfoRow icon={Map}       label={t.alamatLabel} value={booking.address} />
          {booking.notes && <InfoRow icon={StickyNote} label={t.catatanLabel} value={booking.notes} />}
        </div>

        {/* Detail Booking */}
        <div className="bd-card">
          <div className="bd-card-head">
            <div className="bd-card-icon"><ClipboardList size={17} /></div>
            <div className="bd-card-title">{t.detailBooking}</div>
          </div>
          <InfoRow icon={Activity}   label={t.treatmentLabel}   value={booking.product_name} />
          <InfoRow icon={Hash}       label={t.hargaLabel}       value={booking.price_label ?? '-'} />
          <InfoRow icon={Calendar}   label={t.tanggalLabel}     value={longDate} />
          <InfoRow icon={Clock}      label={t.waktuLabel}       value={booking.booking_time} />
          <InfoRow icon={Users}      label={t.jumlahOrangLabel} value={booking.people_count} />
          <InfoRow icon={Navigation} label={t.tipeLokasi}       value={booking.location_type} />
          <InfoRow icon={MapPin}     label={t.areaLabel}        value={booking.service_area_name ?? '-'} />
          <InfoRow icon={Globe}      label={t.sumberLabel}      value={booking.source} />
          <InfoRow icon={Clock}      label={t.dibuatLabel}      value={fmtDateTime(booking.created_at)} />
        </div>
      </div>

      {/* ── Update Status ── */}
      <div className="bd-card" style={{ marginBottom: 18 }}>
        <div className="bd-card-head">
          <div className="bd-card-icon"><RefreshCcw size={17} /></div>
          <div className="bd-card-title">{t.updateStatus}</div>
        </div>

        <div className="bd-status-btns">
          {STATUS_VALUES.map((sv) => {
            const active = newStatus === sv;
            const theme2 = STATUS_THEME[sv] ?? { color: '#667676', bg: '#f5f5f5' };
            return (
              <button
                key={sv}
                type="button"
                className={`bd-status-btn${active ? ' is-active' : ''}`}
                style={active ? { borderColor: theme2.color, background: theme2.bg, color: theme2.color } : {}}
                onClick={() => setNewStatus(sv)}
                disabled={saving}
              >
                {sLabel(sv)}
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>

        <textarea
          className="bd-textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.catatanOpsionalPlaceholder}
          disabled={saving}
        />

        {error      && <div className="bd-alert bd-alert-error">{error}</div>}
        {successMsg && <div className="bd-alert bd-alert-success">{successMsg}</div>}

        <div className="bd-save-row">
          <button
            type="button"
            className="bd-save-btn"
            onClick={requestStatusUpdate}
            disabled={saving || newStatus === booking.status}
          >
            {saving ? t.menyimpan : t.simpanStatus}
          </button>
        </div>
      </div>

      {/* ── Riwayat Status ── */}
      {booking.statusHistory.length > 0 && (
        <div className="bd-card">
          <div className="bd-card-head">
            <div className="bd-card-icon"><History size={17} /></div>
            <div className="bd-card-title">{t.riwayatStatus}</div>
          </div>

          <div className="bd-timeline">
            {booking.statusHistory.map((h, i) => (
              <div className="bd-timeline-item" key={`${h.created_at}-${i}`}>
                <div className="bd-timeline-dot" />
                <div className="bd-timeline-time">{fmtDateTime(h.created_at)}</div>
                <div className="bd-timeline-chips">
                  <span className="bd-chip bd-chip-old">{sLabel(h.old_status)}</span>
                  <span className="bd-chip-arrow"><ArrowRight size={14} /></span>
                  <span className="bd-chip bd-chip-new">{sLabel(h.new_status)}</span>
                  {h.note && <span className="bd-timeline-note">{h.note}</span>}
                </div>
                {h.changed_by_name && (
                  <div className="bd-timeline-admin">
                    <User size={12} />
                    {h.changed_by_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
