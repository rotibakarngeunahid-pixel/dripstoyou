import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { BookingStatus } from '@prisma/client';

const STATUS_LABELS: Record<BookingStatus, string> = {
  BARU:        'Baru',
  KONFIRMASI:  'Konfirmasi',
  DIPROSES:    'Diproses',
  SELESAI:     'Selesai',
  DIBATALKAN:  'Dibatalkan',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  BARU:        '#C9944C',
  KONFIRMASI:  '#29808B',
  DIPROSES:    '#8EBFBF',
  SELESAI:     '#25D366',
  DIBATALKAN:  '#ef4444',
};

export default async function BookingsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      customerPhoneEncrypted: true,
      customerPhoneLast4: true,
      bookingDate: true,
      bookingTime: true,
      peopleCount: true,
      locationType: true,
      status: true,
      source: true,
      createdAt: true,
      product: { select: { name: true } },
      serviceArea: { select: { name: true } },
    },
  });

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
                let phone = `···${b.customerPhoneLast4}`;
                try { phone = decrypt(b.customerPhoneEncrypted); } catch {}
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f0eeea' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#205251', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{b.bookingCode}</td>
                    <td style={{ padding: '10px 14px', color: '#1e2828', whiteSpace: 'nowrap' }}>{b.customerName}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', fontFamily: 'monospace' }}>{phone}</td>
                    <td style={{ padding: '10px 14px', color: '#1e2828', whiteSpace: 'nowrap' }}>{b.product.name}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', whiteSpace: 'nowrap' }}>
                      {new Date(b.bookingDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e' }}>{b.bookingTime}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', textAlign: 'center' }}>{b.peopleCount}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', whiteSpace: 'nowrap' }}>{b.serviceArea?.name ?? b.locationType}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: STATUS_COLORS[b.status] + '22', color: STATUS_COLORS[b.status], padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, border: `1px solid ${STATUS_COLORS[b.status]}44`, whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7e7e', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {new Date(b.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
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
