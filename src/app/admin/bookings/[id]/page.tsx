'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

const STATUS_OPTIONS = [
  { value: 'BARU', label: 'Baru', color: '#b8833e' },
  { value: 'KONFIRMASI', label: 'Konfirmasi', color: '#276f73' },
  { value: 'DIPROSES', label: 'Diproses', color: '#5e9c98' },
  { value: 'SELESAI', label: 'Selesai', color: '#1b8f4d' },
  { value: 'DIBATALKAN', label: 'Dibatalkan', color: '#c0392b' },
] as const;

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
};

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

function statusColor(status: string) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.color ?? '#667676';
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID');
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmStatus, setConfirmStatus] = useState(false);

  async function loadBooking() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { cache: 'no-store' });
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

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadBooking(); }, [id]);

  function requestStatusUpdate() {
    if (!booking || newStatus === booking.status) return;
    setConfirmStatus(true);
  }

  async function updateStatus() {
    if (!booking || newStatus === booking.status) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as ApiResponse<{ status: string }>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Gagal menyimpan status');
        return;
      }
      setBooking((current) => (current ? { ...current, status: json.data?.status ?? newStatus } : current));
      setNote('');
      setConfirmStatus(false);
      await loadBooking();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="skeleton-line" style={{ width: 220, height: 28, marginBottom: 24 }} />
        <div className="admin-detail-grid">
          <div className="form-card"><div className="skeleton-block" /></div>
          <div className="form-card"><div className="skeleton-block" /></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="admin-page">
        <div className="alert alert-error">{error || 'Booking tidak ditemukan'}</div>
      </div>
    );
  }

  const currentColor = statusColor(booking.status);
  const nextStatusLabel = STATUS_OPTIONS.find((item) => item.value === newStatus)?.label ?? newStatus;

  return (
    <div className="admin-page">
      <ConfirmModal
        open={confirmStatus}
        title="Ubah Status Booking"
        message={`Status booking ${booking.booking_code} akan diubah dari ${booking.status} menjadi ${nextStatusLabel}.`}
        confirmLabel="Simpan Status"
        loadingLabel="Menyimpan..."
        loading={saving}
        danger={newStatus === 'DIBATALKAN'}
        onConfirm={updateStatus}
        onCancel={() => setConfirmStatus(false)}
      />

      <button className="icon-link" onClick={() => router.back()} type="button" style={{ background: 'none', border: 0, padding: 0, marginBottom: 20 }}>
        Kembali
      </button>

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{booking.booking_code}</h1>
          <span className="status-pill" style={{ color: currentColor, background: `${currentColor}18` }}>
            {booking.status}
          </span>
        </div>
      </div>

      <div className="admin-detail-grid">
        <section className="form-card">
          <h2 className="form-card-title">Info Pelanggan</h2>
          <div className="info-list">
            {[
              ['Nama', booking.customer_name],
              ['No. HP', booking.phone],
              ['Alamat', booking.address],
              ...(booking.notes ? [['Catatan', booking.notes]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <div className="info-label">{label}</div>
                <div className="info-value">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="form-card">
          <h2 className="form-card-title">Detail Booking</h2>
          <div className="info-list">
            {[
              ['Treatment', booking.product_name],
              ['Harga', booking.price_label ?? '-'],
              ['Tanggal', new Date(booking.booking_date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })],
              ['Waktu', booking.booking_time],
              ['Jumlah Orang', String(booking.people_count)],
              ['Tipe Lokasi', booking.location_type],
              ['Area', booking.service_area_name ?? '-'],
              ['Sumber', booking.source],
              ['Dibuat', formatDateTime(booking.created_at)],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="info-label">{label}</div>
                <div className="info-value">{value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="form-card" style={{ marginBottom: 20 }}>
        <h2 className="form-card-title">Update Status</h2>
        <div className="status-button-row" style={{ marginBottom: 14 }}>
          {STATUS_OPTIONS.map((status) => (
            <button
              className="status-choice"
              key={status.value}
              onClick={() => setNewStatus(status.value)}
              type="button"
              disabled={saving}
              style={{
                borderColor: newStatus === status.value ? status.color : undefined,
                color: newStatus === status.value ? status.color : undefined,
                background: newStatus === status.value ? `${status.color}16` : undefined,
              }}
            >
              {status.label}
            </button>
          ))}
        </div>
        <textarea
          className="control"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan (opsional)..."
          style={{ marginBottom: 12 }}
        />
        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
        <button
          className={`button button-primary${saving ? ' loading' : ''}`}
          onClick={requestStatusUpdate}
          disabled={saving || newStatus === booking.status}
          type="button"
        >
          {saving ? 'Menyimpan' : 'Simpan Status'}
        </button>
      </section>

      {booking.statusHistory.length > 0 && (
        <section className="form-card">
          <h2 className="form-card-title">Riwayat Status</h2>
          <div className="history-list">
            {booking.statusHistory.map((history, index) => (
              <div className="history-item" key={`${history.created_at}-${index}`}>
                <div className="muted-small">{formatDateTime(history.created_at)}</div>
                <div className="info-value">
                  <span className="muted-small">{history.old_status}</span>
                  <span style={{ color: 'var(--ocean)', margin: '0 6px' }}>to</span>
                  <strong style={{ color: 'var(--teal)' }}>{history.new_status}</strong>
                  {history.note && <span className="muted-small" style={{ marginLeft: 8 }}>{history.note}</span>}
                </div>
                {history.changed_by_name && <div className="muted-small">{history.changed_by_name}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
