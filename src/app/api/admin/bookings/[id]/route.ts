import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { decrypt } from '@/lib/encryption';
import { auditLog } from '@/lib/audit';
import { BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  note: z.string().max(500).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      product: { select: { name: true, priceLabel: true } },
      serviceArea: { select: { name: true } },
      statusHistory: { orderBy: { createdAt: 'desc' }, include: { changedBy: { select: { name: true } } } },
    },
  });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let phone = `···${booking.customerPhoneLast4}`;
  let address = '(encrypted)';
  let notes: string | null = null;
  try { phone = decrypt(booking.customerPhoneEncrypted); } catch {}
  try { address = decrypt(booking.addressEncrypted); } catch {}
  if (booking.notesEncrypted) {
    try { notes = decrypt(booking.notesEncrypted); } catch {}
  }

  return NextResponse.json({ booking: { ...booking, phone, address, notes } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status, note } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({ where: { id }, data: { status } });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        oldStatus: booking.status,
        newStatus: status,
        changedByAdminId: session.adminId!,
        note,
      },
    });
    return b;
  });

  await auditLog({
    actorAdminId: session.adminId,
    action: 'UPDATE_BOOKING_STATUS',
    entityType: 'Booking',
    entityId: id,
    metadata: { oldStatus: booking.status, newStatus: status },
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ booking: updated });
}
