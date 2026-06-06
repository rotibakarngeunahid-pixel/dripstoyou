import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

function formatDate(value: Date, withYear = true) {
  return value.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' as const } : {}),
  });
}

export default async function BookingsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');

  const bookings = await prisma.booking.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true } },
      serviceArea: { select: { name: true } },
    },
  });

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
                const status = booking.status as BookingStatus;
                const color = STATUS_COLORS[status] ?? '#667676';
                return (
                  <tr key={booking.id} style={{ cursor: 'pointer' }}>
                    <td className="mono" style={{ color: 'var(--teal)', fontWeight: 800 }}>
                      <a href={`/admin/bookings/${booking.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {booking.bookingCode}
                      </a>
                    </td>
                    <td>{booking.customerName}</td>
                    <td className="mono muted-small">...{booking.customerPhoneLast4}</td>
                    <td>{booking.product.name}</td>
                    <td className="muted-small">{formatDate(booking.bookingDate)}</td>
                    <td className="muted-small">{booking.bookingTime}</td>
                    <td className="muted-small">{booking.peopleCount}</td>
                    <td className="muted-small">{booking.serviceArea?.name ?? booking.locationType}</td>
                    <td>
                      <span className="status-pill" style={{ color, background: `${color}18` }}>
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td className="muted-small">{formatDate(booking.createdAt, false)}</td>
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
