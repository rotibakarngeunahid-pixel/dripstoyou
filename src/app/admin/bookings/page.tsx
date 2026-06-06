import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

type BookingStatus = 'BARU' | 'KONFIRMASI' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';

const STATUS_LABELS: Record<BookingStatus, string> = {
  BARU: 'Baru',
  KONFIRMASI: 'Konfirmasi',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  BARU: '#b8833e',
  KONFIRMASI: '#276f73',
  DIPROSES: '#5e9c98',
  SELESAI: '#1b8f4d',
  DIBATALKAN: '#c0392b',
};

interface Booking {
  id: string;
  booking_code: string;
  customer_name: string;
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

async function getBookings(token: string): Promise<Booking[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/bookings.php?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

function formatDate(value: string, withYear = true) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' as const } : {}),
  });
}

export default async function BookingsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const bookings = await getBookings(session.adminToken);

  return (
    <div className="admin-page wide">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Bookings</h1>
          <p className="admin-subtitle">{bookings.length} booking ditampilkan</p>
        </div>
      </div>

      <section className="table-shell">
        <div className="table-wrap">
          <table className="data-table" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                {['Kode', 'Pelanggan', 'No. HP', 'Treatment', 'Tanggal', 'Waktu', 'Orang', 'Area', 'Status', 'Dibuat'].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const color = STATUS_COLORS[booking.status] ?? '#667676';
                return (
                  <tr key={booking.id}>
                    <td className="mono" style={{ color: 'var(--teal)', fontWeight: 800 }}>
                      {booking.booking_code}
                    </td>
                    <td>{booking.customer_name}</td>
                    <td className="mono muted-small">...{booking.customer_phone_last4}</td>
                    <td>{booking.product_name}</td>
                    <td className="muted-small">{formatDate(booking.booking_date)}</td>
                    <td className="muted-small">{booking.booking_time}</td>
                    <td className="muted-small">{booking.people_count}</td>
                    <td className="muted-small">{booking.service_area_name ?? booking.location_type}</td>
                    <td>
                      <span className="status-pill" style={{ color, background: `${color}18` }}>
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </span>
                    </td>
                    <td className="muted-small">{formatDate(booking.created_at, false)}</td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty-state">Belum ada booking</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
