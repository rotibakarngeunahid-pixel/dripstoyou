import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

type BookingStatus = 'BARU' | 'KONFIRMASI' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';

const STATUS_LABELS: Record<BookingStatus, string> = {
  BARU:       'Baru',
  KONFIRMASI: 'Konfirmasi',
  DIPROSES:   'Diproses',
  SELESAI:    'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  BARU:       '#C9944C',
  KONFIRMASI: '#29808B',
  DIPROSES:   '#8EBFBF',
  SELESAI:    '#25D366',
  DIBATALKAN: '#ef4444',
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
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function BookingsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const bookings = await getBookings(session.adminToken);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#205251', marginBottom: 4 }}>Bookings</h1>
          <p style={{ color: '#6b7e7e', fontSize: 14 }}>{bookings.length} booking ditampilkan</p>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(32,82,81,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f7f4' }}>
                {['Kode', 'Pelanggan', 'No. HP', 'Treatment', 'Tanggal', 'Waktu', 'Orang', 'Area', 'Status', 'Dibuat'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: '#6b7e7e', fontWeight: 600, borderBottom: '1px solid #DBDAD7', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const statusColor = STATUS_COLORS[b.status] ?? '#999';
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f0eeea' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#205251', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{b.booking_code}</td>
                    <td style={{ padding: '10px 14px', color: '#1e2828', whiteSpace: 'nowrap' }}>{b.customer_name}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', fontFamily: 'monospace' }}>···{b.customer_phone_last4}</td>
                    <td style={{ padding: '10px 14px', color: '#1e2828', whiteSpace: 'nowrap' }}>{b.product_name}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', whiteSpace: 'nowrap' }}>
                      {new Date(b.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e' }}>{b.booking_time}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', textAlign: 'center' }}>{b.people_count}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', whiteSpace: 'nowrap' }}>{b.service_area_name ?? b.location_type}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: statusColor + '22', color: statusColor, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, border: `1px solid ${statusColor}44`, whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {new Date(b.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '32px 14px', textAlign: 'center', color: '#6b7e7e' }}>Belum ada booking</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
