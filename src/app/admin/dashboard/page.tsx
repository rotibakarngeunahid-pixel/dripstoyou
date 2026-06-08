import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarCheck2, ChevronUp, ClipboardList, Clock3 } from 'lucide-react';
import { getSession } from '@/lib/session';

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

async function getDashboardData(token: string): Promise<DashboardData | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/dashboard.php`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  BARU: { label: 'Pending', className: 'status-pending' },
  KONFIRMASI: { label: 'Konfirmasi', className: 'status-confirmed' },
  DIPROSES: { label: 'Diproses', className: 'status-processing' },
  SELESAI: { label: 'Selesai', className: 'status-done' },
  DIBATALKAN: { label: 'Dibatalkan', className: 'status-cancelled' },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function monthDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const delta = Math.round(((current - previous) / previous) * 100);
  return `${delta >= 0 ? '+' : ''}${delta}%`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string }>;
}) {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  const query = await searchParams;

  const data = await getDashboardData(session.adminToken);
  if (!data) redirect('/admin/login');

  const stats = [
    {
      label: 'Total Bookings',
      value: data.totalBookings,
      context: `${monthDelta(data.monthBookings, data.previousMonthBookings)} dari bulan lalu`,
      icon: ClipboardList,
      tone: 'teal',
    },
    {
      label: 'Menunggu Konfirmasi',
      value: data.pendingBookings,
      context: 'Butuh follow-up admin',
      icon: Clock3,
      tone: 'gold',
    },
    {
      label: 'Booking Hari Ini',
      value: data.todayBookings,
      context: 'Jadwal aktif hari ini',
      icon: CalendarCheck2,
      tone: 'ocean',
    },
  ];

  return (
    <div className="admin-page dashboard-page">
      {query.login === 'success' && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          Login berhasil. Selamat datang, {session.name}.
        </div>
      )}

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-subtitle">Welcome back, {session.name}</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className={`admin-stat-card tone-${stat.tone}`} key={stat.label}>
              <div className="admin-stat-card-top">
                <span className="admin-stat-icon"><Icon size={20} /></span>
                <span>{stat.label}</span>
              </div>
              <div className="admin-stat-card-main">
                <strong>{stat.value}</strong>
                {stat.tone === 'teal' && (
                  <span className="admin-stat-delta">
                    <ChevronUp size={14} /> {monthDelta(data.monthBookings, data.previousMonthBookings)}
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
          <h2 className="admin-card-title">Booking Terbaru</h2>
          <Link href="/admin/bookings" className="button button-secondary table-action">
            Lihat semua
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {['Kode', 'Pelanggan', 'No. HP', 'Treatment', 'Area', 'Tanggal', 'Waktu', 'Status'].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentBookings.map((booking) => {
                const status = STATUS_META[booking.status] ?? { label: booking.status, className: 'status-processing' };
                return (
                  <tr key={booking.booking_code}>
                    <td className="mono" data-label="Kode">
                      {booking.booking_code}
                    </td>
                    <td data-label="Pelanggan">{booking.customer_name}</td>
                    <td data-label="No. HP" className="mono">
                      {booking.customer_phone ?? `...${booking.customer_phone_last4}`}
                    </td>
                    <td data-label="Treatment">{booking.product_name}</td>
                    <td data-label="Area" className="muted-small">{booking.service_area_name ?? booking.location_type}</td>
                    <td data-label="Tanggal" className="muted-small">{formatDate(booking.booking_date)}</td>
                    <td data-label="Waktu" className="muted-small">{booking.booking_time}</td>
                    <td data-label="Status">
                      <span className={`status-pill ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {data.recentBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">Belum ada booking</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
