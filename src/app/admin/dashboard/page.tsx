import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Link from 'next/link';

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
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const data = await getDashboardData(session.adminToken);
  if (!data) redirect('/admin/login');

  const { totalBookings, pendingBookings, todayBookings, recentBookings } = data;

  const statusColors: Record<string, string> = {
    BARU:        '#C9944C',
    KONFIRMASI:  '#29808B',
    DIPROSES:    '#8EBFBF',
    SELESAI:     '#25D366',
    DIBATALKAN:  '#ef4444',
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#205251', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7e7e', fontSize: 14 }}>Welcome back, {session.name}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
        {[
          { label: 'Total Bookings',          value: totalBookings,   color: '#205251' },
          { label: 'Menunggu Konfirmasi',      value: pendingBookings, color: '#C9944C' },
          { label: 'Booking Hari Ini',         value: todayBookings,   color: '#29808B' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: '24px 20px', boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: stat.color, fontFamily: 'Playfair Display, Georgia, serif', marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: '#6b7e7e' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, fontWeight: 600, color: '#205251' }}>
            Booking Terbaru
          </h2>
          <Link href="/admin/bookings" style={{ fontSize: 13, color: '#29808B', fontWeight: 500 }}>
            Lihat semua →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Kode', 'Pelanggan', 'Treatment', 'Tanggal', 'Waktu', 'Status'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7e7e', fontWeight: 600, borderBottom: '1px solid #DBDAD7', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.booking_code} style={{ borderBottom: '1px solid #f0eeea' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#205251', fontFamily: 'monospace' }}>{b.booking_code}</td>
                  <td style={{ padding: '10px 12px', color: '#1e2828' }}>{b.customer_name} <span style={{ color: '#999', fontSize: 11 }}>···{b.customer_phone_last4}</span></td>
                  <td style={{ padding: '10px 12px', color: '#1e2828' }}>{b.product_name}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7e7e' }}>{new Date(b.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7e7e' }}>{b.booking_time}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: (statusColors[b.status] ?? '#999') + '22', color: statusColors[b.status] ?? '#999', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, border: `1px solid ${(statusColors[b.status] ?? '#999')}44` }}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '24px 12px', textAlign: 'center', color: '#6b7e7e' }}>Belum ada booking</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
