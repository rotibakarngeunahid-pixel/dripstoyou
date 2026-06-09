'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
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

/* ─── Status config ─── */
const STATUS_OPTIONS = [
  { value: 'BARU',       label: 'Baru',       color: '#b8833e', bg: '#fdf8f3' },
  { value: 'KONFIRMASI', label: 'Konfirmasi', color: '#276f73', bg: '#f0f7f7' },
  { value: 'DIPROSES',   label: 'Diproses',   color: '#5e9c98', bg: '#f2f8f8' },
  { value: 'SELESAI',    label: 'Selesai',    color: '#1b8f4d', bg: '#f0fdf4' },
  { value: 'DIBATALKAN', label: 'Dibatalkan', color: '#c0392b', bg: '#fef2f2' },
] as const;

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

/* ─── Helpers ─── */
function statusTheme(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status) ?? {
      color: '#667676',
      bg: '#f5f5f5',
      label: status,
    }
  );
}

function fmtDateTime(v: string) {
  return new Date(v).toLocaleString('id-ID');
}

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
      <div className="bd-info-icon">
        <Icon size={14} />
      </div>
      <div className="bd-info-label">{label}</div>
      <div className="bd-info-sep">:</div>
      <div className="bd-info-val">{value}</div>
    </div>
  );
}

/* ─── Page ─── */
export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [booking,       setBooking]       = useState<Booking | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [newStatus,     setNewStatus]     = useState('');
  const [note,          setNote]          = useState('');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [confirmStatus, setConfirmStatus] = useState(false);

  /* fetch */
  async function loadBooking() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/admin/bookings/${id}`, { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<Booking>;
      if (!res.ok) {
        setBooking(null);
        setError(json.message ?? json.error ?? 'Gagal memuat booking.');
        return;
      }
      setBooking(json.data ?? null);
      setNewStatus(json.data?.status ?? '');
    } catch {
      setError('Gagal memuat booking.');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadBooking(); }, [id]);

  function requestStatusUpdate() {
    if (!booking || newStatus === booking.status) return;
    setConfirmStatus(true);
  }

  async function updateStatus() {
    if (!booking || newStatus === booking.status) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res  = await fetch(`/api/admin/bookings/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as ApiResponse<{ status: string }>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Gagal menyimpan status');
        return;
      }
      setBooking((cur) => (cur ? { ...cur, status: json.data?.status ?? newStatus } : cur));
      setNote('');
      setConfirmStatus(false);
      setSuccessMsg('Status berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 3500);
      await loadBooking();
      void fetch('/api/admin/bookings', { cache: 'no-store' }).catch(() => {});
    } catch {
      setError('Network error');
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
        <div className="bd-alert bd-alert-error">{error || 'Booking tidak ditemukan'}</div>
      </div>
    );
  }

  /* ── Derived values ── */
  const theme          = statusTheme(booking.status);
  const nextLabel      = STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus;
  const longDate       = new Date(booking.booking_date).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const shortDate      = new Date(booking.booking_date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="admin-page">
      {/* Confirm modal */}
      <ConfirmModal
        open={confirmStatus}
        title="Ubah Status Booking"
        message={`Status booking ${booking.booking_code} akan diubah dari ${booking.status} menjadi ${nextLabel}.`}
        confirmLabel="Simpan Status"
        loadingLabel="Menyimpan..."
        loading={saving}
        danger={newStatus === 'DIBATALKAN'}
        onConfirm={updateStatus}
        onCancel={() => setConfirmStatus(false)}
      />

      {/* ── Back button ── */}
      <button className="bd-back-btn" type="button" onClick={() => router.back()}>
        <ArrowLeft size={15} />
        Kembali
      </button>

      {/* ── Header ── */}
      <div className="bd-header">
        <h1 className="bd-code">{booking.booking_code}</h1>
        <span
          className="bd-status-badge"
          style={{ color: theme.color, background: theme.bg }}
        >
          {theme.label}
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
            <span className="bd-summary-label">Tanggal</span>
            <span className="bd-summary-value">{shortDate}</span>
          </div>
        </div>

        <div className="bd-summary-card">
          <div className="bd-summary-icon"><Clock size={18} /></div>
          <div className="bd-summary-text">
            <span className="bd-summary-label">Waktu</span>
            <span className="bd-summary-value">{booking.booking_time}</span>
          </div>
        </div>

        <div className="bd-summary-card">
          <div className="bd-summary-icon"><MapPin size={18} /></div>
          <div className="bd-summary-text">
            <span className="bd-summary-label">Area</span>
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
            <div className="bd-card-title">Info Pelanggan</div>
          </div>
          <InfoRow icon={User}      label="Nama"    value={booking.customer_name} />
          <InfoRow icon={Phone}     label="No. HP"  value={booking.phone} />
          <InfoRow icon={Map}       label="Alamat"  value={booking.address} />
          {booking.notes && <InfoRow icon={StickyNote} label="Catatan" value={booking.notes} />}
        </div>

        {/* Detail Booking */}
        <div className="bd-card">
          <div className="bd-card-head">
            <div className="bd-card-icon"><ClipboardList size={17} /></div>
            <div className="bd-card-title">Detail Booking</div>
          </div>
          <InfoRow icon={Activity}   label="Treatment"    value={booking.product_name} />
          <InfoRow icon={Hash}       label="Harga"        value={booking.price_label ?? '-'} />
          <InfoRow icon={Calendar}   label="Tanggal"      value={longDate} />
          <InfoRow icon={Clock}      label="Waktu"        value={booking.booking_time} />
          <InfoRow icon={Users}      label="Jumlah Orang" value={booking.people_count} />
          <InfoRow icon={Navigation} label="Tipe Lokasi"  value={booking.location_type} />
          <InfoRow icon={MapPin}     label="Area"         value={booking.service_area_name ?? '-'} />
          <InfoRow icon={Globe}      label="Sumber"       value={booking.source} />
          <InfoRow icon={Clock}      label="Dibuat"       value={fmtDateTime(booking.created_at)} />
        </div>
      </div>

      {/* ── Update Status ── */}
      <div className="bd-card" style={{ marginBottom: 18 }}>
        <div className="bd-card-head">
          <div className="bd-card-icon"><RefreshCcw size={17} /></div>
          <div className="bd-card-title">Update Status</div>
        </div>

        <div className="bd-status-btns">
          {STATUS_OPTIONS.map((s) => {
            const active = newStatus === s.value;
            return (
              <button
                key={s.value}
                type="button"
                className={`bd-status-btn${active ? ' is-active' : ''}`}
                onClick={() => setNewStatus(s.value)}
                disabled={saving}
              >
                {s.label}
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>

        <textarea
          className="bd-textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan (opsional)..."
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
            {saving ? 'Menyimpan...' : 'Simpan Status'}
          </button>
        </div>
      </div>

      {/* ── Riwayat Status ── */}
      {booking.statusHistory.length > 0 && (
        <div className="bd-card">
          <div className="bd-card-head">
            <div className="bd-card-icon"><History size={17} /></div>
            <div className="bd-card-title">Riwayat Status</div>
          </div>

          <div className="bd-timeline">
            {booking.statusHistory.map((h, i) => (
              <div className="bd-timeline-item" key={`${h.created_at}-${i}`}>
                <div className="bd-timeline-dot" />
                <div className="bd-timeline-time">{fmtDateTime(h.created_at)}</div>

                <div className="bd-timeline-chips">
                  <span className="bd-chip bd-chip-old">{h.old_status}</span>
                  <span className="bd-chip-arrow"><ArrowRight size={14} /></span>
                  <span className="bd-chip bd-chip-new">{h.new_status}</span>
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
