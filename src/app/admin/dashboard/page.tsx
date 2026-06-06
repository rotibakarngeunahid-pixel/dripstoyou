import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const STATUS_COLORS: Record<string, string> = {
  BARU: '#b8833e',
  KONFIRMASI: '#276f73',
  DIPROSES: '#5e9c98',
  SELESAI: '#1b8f4d',
  DIBATALKAN: '#c0392b',
};

function formatDate(value: Date) {
  return value.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalBookings, pendingBookings, todayBookings, recentBookings] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'BARU' } }),
    prisma.booking.count({ where: { bookingDate: { gte: today, lt: tomorrow } } }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: 'Total Bookings', value: totalBookings, color: 'var(--teal)' },
    { label: 'Menunggu Konfirmasi', value: pendingBookings, color: 'var(--gold)' },
    { label: 'Booking Hari Ini', value: todayBookings, color: 'var(--ocean)' },
  ];

  return (
    <div className="admin-page">
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
              {recentBookings.map((booking) => {
                const color = STATUS_COLORS[booking.status] ?? '#667676';
                return (
                  <tr key={booking.bookingCode}>
                    <td className="mono" style={{ color: 'var(--teal)', fontWeight: 800 }}>
                      {booking.bookingCode}
                    </td>
                    <td>
                      {booking.customerName}{' '}
                      <span className="muted-small">...{booking.customerPhoneLast4}</span>
                    </td>
                    <td>{booking.product.name}</td>
                    <td className="muted-small">{formatDate(booking.bookingDate)}</td>
                    <td className="muted-small">{booking.bookingTime}</td>
                    <td>
                      <span className="status-pill" style={{ color, background: `${color}18` }}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentBookings.length === 0 && (
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
