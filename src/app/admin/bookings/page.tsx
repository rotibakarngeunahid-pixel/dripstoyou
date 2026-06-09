'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

type BookingStatus = 'BARU' | 'KONFIRMASI' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';

const STATUS_COLORS: Record<BookingStatus, string> = {
  BARU: 'status-pending',
  KONFIRMASI: 'status-confirmed',
  DIPROSES: 'status-processing',
  SELESAI: 'status-done',
  DIBATALKAN: 'status-cancelled',
};

interface Booking {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_last4: string;
  booking_date: string;
  booking_time: string;
  people_count: number;
  location_type: string;
  status: BookingStatus;
  source: string;
  created_at: string;
  product_name: string;
  service_area_name: string | null;
}

function formatDate(value: string, withYear = true) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' as const } : {}),
  });
}

export default function BookingsPage() {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bookings', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setBookings(json.data);
        setError('');
        setLastUpdated(new Date());
        setSecondsAgo(0);
      } else {
        setError(json.error ?? t.gagalMemuatBooking);
      }
    } catch {
      setError(t.koneksiBookingFailed);
    } finally {
      setLoading(false);
    }
  }, [t.gagalMemuatBooking, t.koneksiBookingFailed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchBookings();
    const poll = setInterval(() => { void fetchBookings(); }, 10000);
    return () => clearInterval(poll);
  }, [fetchBookings]);

  useEffect(() => {
    if (!lastUpdated) return;
    const tick = setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const statusLabel = (s: BookingStatus) => t[`status${s}` as keyof typeof t] ?? s;

  const tableHeaders = [
    t.kode, t.pelanggan, t.noHP, t.treatment, t.tanggal,
    t.waktu, t.orang, t.area, t.status, t.dibuat, t.aksi,
  ];

  if (loading) {
    return (
      <div className="admin-page wide">
        <div className="admin-page-head">
          <div>
            <h1 className="admin-title">{t.bookingsTitle}</h1>
            <p className="admin-subtitle">{t.memuatData}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page wide">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.bookingsTitle}</h1>
          <p className="admin-subtitle">
            {bookings.length} {t.bookingsDitampilkan}
            {lastUpdated && (
              <span style={{ marginLeft: 12, fontSize: 11, color: '#aaa' }}>
                · {t.diperbarui} {secondsAgo}{t.detikLalu}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => { void fetchBookings(); }}
            style={{ fontSize: 13 }}
          >
            {t.refresh}
          </button>
          <Link href="/api/admin/bookings/export" className="button button-secondary">
            {t.exportCSV}
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <section className="table-shell">
        <div className="table-wrap">
          <table className="data-table" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                {tableHeaders.map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const statusClass = STATUS_COLORS[booking.status] ?? 'status-processing';
                return (
                  <tr key={booking.id}>
                    <td className="mono" style={{ color: 'var(--teal)', fontWeight: 800 }}>
                      {booking.booking_code}
                    </td>
                    <td>{booking.customer_name}</td>
                    <td className="mono muted-small" style={{ whiteSpace: 'nowrap' }}>
                      {booking.customer_phone ?? `...${booking.customer_phone_last4}`}
                    </td>
                    <td>{booking.product_name}</td>
                    <td className="muted-small">{formatDate(booking.booking_date)}</td>
                    <td className="muted-small">{booking.booking_time}</td>
                    <td className="muted-small">{booking.people_count}</td>
                    <td className="muted-small">{booking.service_area_name ?? booking.location_type}</td>
                    <td>
                      <span className={`status-pill ${statusClass}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="muted-small">{formatDate(booking.created_at, false)}</td>
                    <td>
                      <Link href={`/admin/bookings/${booking.id}`} className="button button-secondary" style={{ padding: '4px 12px', fontSize: 13 }}>
                        {t.detail}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={11} className="empty-state">{t.belumAdaBooking}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
