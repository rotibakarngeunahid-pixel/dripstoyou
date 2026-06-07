import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

interface RecentBooking {
  booking_code: string;
  customer_name: string;
  customer_phone_last4: string;
  booking_date: string;
  booking_time: string;
  status: string;
  product_name: string;
}

interface DashboardData {
  totalBookings: number;
  pendingBookings: number;
  todayBookings: number;
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

const STATUS_COLORS: Record<string, string> = {
  BARU: '#b8833e',
  KONFIRMASI: '#276f73',
  DIPROSES: '#5e9c98',
  SELESAI: '#1b8f4d',
  DIBATALKAN: '#c0392b',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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
    { label: 'Total Bookings', value: data.totalBookings, color: 'var(--teal)' },
    { label: 'Menunggu Konfirmasi', value: data.pendingBookings, color: 'var(--gold)' },
    { label: 'Booking Hari Ini', value: data.todayBookings, color: 'var(--ocean)' },
  ];

  return (
    <div className="admin-page">
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
        {stats.map((stat) => (
          <div className="admin-card" key={stat.label}>
            <div className="admin-stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="admin-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <section className="table-shell">
        <div className="table-head">
          <h2 className="admin-card-title">Booking Terbaru</h2>
          <Link href="/admin/bookings" className="icon-link">
            Lihat semua
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {['Kode', 'Pelanggan', 'Treatment', 'Tanggal', 'Waktu', 'Status'].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentBookings.map((booking) => {
                const color = STATUS_COLORS[booking.status] ?? '#667676';
                return (
                  <tr key={booking.booking_code}>
                    <td className="mono" style={{ color: 'var(--teal)', fontWeight: 800 }}>
                      {booking.booking_code}
                    </td>
                    <td>
                      {booking.customer_name}{' '}
                      <span className="muted-small">...{booking.customer_phone_last4}</span>
                    </td>
                    <td>{booking.product_name}</td>
                    <td className="muted-small">{formatDate(booking.booking_date)}</td>
                    <td className="muted-small">{booking.booking_time}</td>
                    <td>
                      <span className="status-pill" style={{ color, background: `${color}18` }}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {data.recentBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">Belum ada booking</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
