import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { decrypt } from '@/lib/encryption';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(req, 'export', RATE_LIMITS.EXPORT.limit, RATE_LIMITS.EXPORT.windowMs);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true } },
      serviceArea: { select: { name: true } },
    },
  });

  const header = ['Kode', 'Tanggal Booking', 'Waktu', 'Nama Pelanggan', 'No. HP', 'Treatment', 'Harga', 'Jumlah Orang', 'Tipe Lokasi', 'Area', 'Alamat', 'Catatan', 'Status', 'Sumber', 'Dibuat'].join(',');

  const rows = bookings.map((b) => {
    let phone = `···${b.customerPhoneLast4}`;
    let address = '';
    let notes = '';
    try { phone = decrypt(b.customerPhoneEncrypted); } catch {}
    try { address = decrypt(b.addressEncrypted); } catch {}
    if (b.notesEncrypted) { try { notes = decrypt(b.notesEncrypted); } catch {} }

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [
      b.bookingCode,
      b.bookingDate.toISOString().split('T')[0],
      b.bookingTime,
      escape(b.customerName),
      phone,
      escape(b.product.name),
      b.serviceArea?.name ?? '',
      b.locationType,
      escape(address),
      escape(notes),
      b.status,
      b.source,
      b.createdAt.toISOString(),
    ].join(',');
  });

  const csv = [header, ...rows].join('\r\n');

  await auditLog({
    actorAdminId: session.adminId,
    action: 'EXPORT_BOOKINGS',
    entityType: 'Booking',
    metadata: { count: bookings.length },
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bookings-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
