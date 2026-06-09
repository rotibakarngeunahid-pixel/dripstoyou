'use client';

import Link from 'next/link';
import { CalendarCheck2, ChevronUp, ClipboardList, Clock3 } from 'lucide-react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

interface RecentBooking {
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_last4: string;
  booking_date: string;
  booking_time: string;
  location_type: string;
  service_area_name: string | null;
  status: string;
  product_name: string;
}

interface DashboardData {
  totalBookings: number;
  pendingBookings: number;
  todayBookings: number;
  monthBookings: number;
  previousMonthBookings: number;
  recentBookings: RecentBooking[];
}

const STATUS_CLASS: Record<string, string> = {
  BARU:       'status-pending',
  KONFIRMASI: 'status-confirmed',
  DIPROSES:   'status-processing',
  SELESAI:    'status-done',
  DIBATALKAN: 'status-cancelled',
};

function monthDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const delta = Math.round(((current - previous) / previous) * 100);
  return `${delta >= 0 ? '+' : ''}${delta}%`;
}

export default function DashboardClient({
  data,
  sessionName,
  loginSuccess,
}: {
  data: DashboardData;
  sessionName: string;
  loginSuccess: boolean;
}) {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const locale = lang === 'en' ? 'en-GB' : 'id-ID';

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  const delta = monthDelta(data.monthBookings, data.previousMonthBookings);

  const stats = [
    {
      key:     'total',
      label:   t.totalBookings,
      value:   data.totalBookings,
      context: `${delta} ${t.dariLalu}`,
      icon:    ClipboardList,
      tone:    'teal',
    },
    {
      key:     'pending',
      label:   t.menungguKonfirmasi,
      value:   data.pendingBookings,
      context: t.butuhFollowUp,
      icon:    Clock3,
      tone:    'gold',
    },
    {
      key:     'today',
      label:   t.bookingHariIni,
      value:   data.todayBookings,
      context: t.jadwalAktifHariIni,
      icon:    CalendarCheck2,
      tone:    'ocean',
    },
  ];

  const tableHeaders = [t.kode, t.pelanggan, t.noHP, t.treatment, t.area, t.tanggal, t.waktu, t.status];

  return (
    <div className="admin-page dashboard-page">
      {loginSuccess && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {t.loginBerhasilPrefix} {sessionName}.
        </div>
      )}

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.dashboardTitle}</h1>
          <p className="admin-subtitle">Welcome back, {sessionName}</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className={`admin-stat-card tone-${stat.tone}`} key={stat.key}>
              <div className="admin-stat-card-top">
                <span className="admin-stat-icon"><Icon size={20} /></span>
                <span>{stat.label}</span>
              </div>
              <div className="admin-stat-card-main">
                <strong>{stat.value}</strong>
                {stat.tone === 'teal' && (
                  <span className="admin-stat-delta">
                    <ChevronUp size={14} /> {delta}
                  </span>
                )}
              </div>
              <p>{stat.context}</p>
            </div>
          );
        })}
      </div>

      <section className="table-shell recent-bookings-shell">
        <div className="table-head">
          <h2 className="admin-card-title">{t.bookingTerbaru}</h2>
          <Link href="/admin/bookings" className="button button-secondary table-action">
            {t.lihatSemua}
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {tableHeaders.map((heading) => <th key={heading}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.recentBookings.map((booking) => {
                const statusLabel = (t[`status${booking.status}` as keyof typeof t] as string | undefined) ?? booking.status;
                const statusClass = STATUS_CLASS[booking.status] ?? 'status-processing';
                return (
                  <tr key={booking.booking_code}>
                    <td className="mono" data-label={t.kode}>{booking.booking_code}</td>
                    <td data-label={t.pelanggan}>{booking.customer_name}</td>
                    <td data-label={t.noHP} className="mono">
                      {booking.customer_phone ?? `...${booking.customer_phone_last4}`}
                    </td>
                    <td data-label={t.treatment}>{booking.product_name}</td>
                    <td data-label={t.area} className="muted-small">{booking.service_area_name ?? booking.location_type}</td>
                    <td data-label={t.tanggal} className="muted-small">{formatDate(booking.booking_date)}</td>
                    <td data-label={t.waktu} className="muted-small">{booking.booking_time}</td>
                    <td data-label={t.status}>
                      <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                    </td>
                  </tr>
                );
              })}
              {data.recentBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">{t.belumAdaBookingDash}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
