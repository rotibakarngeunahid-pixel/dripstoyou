import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';
import { safeDecrypt } from '@/lib/encryption';
import { SessionData } from '@/lib/session';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['BARU', 'KONFIRMASI', 'DIPROSES', 'SELESAI', 'DIBATALKAN'] as const;

const PatchSchema = z.object({
  status: z.enum(VALID_STATUSES),
  note: z.string().max(500).optional(),
});

export const GET = adminApiHandler('bookings:read', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  try {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id },
      include: {
        product: { select: { name: true, priceLabel: true } },
        serviceArea: { select: { name: true } },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { changedBy: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({
      data: {
        id: booking.id,
        booking_code: booking.bookingCode,
        customer_name: booking.customerName,
        phone: safeDecrypt(booking.customerPhoneEncrypted, `...${booking.customerPhoneLast4}`),
        address: safeDecrypt(booking.addressEncrypted, '(alamat tidak tersedia)'),
        notes: booking.notesEncrypted ? safeDecrypt(booking.notesEncrypted) : null,
        booking_date: booking.bookingDate.toISOString(),
        booking_time: booking.bookingTime,
        people_count: booking.peopleCount,
        location_type: booking.locationType,
        status: booking.status,
        source: booking.source,
        created_at: booking.createdAt.toISOString(),
        product_name: booking.product.name,
        price_label: booking.product.priceLabel,
        service_area_name: booking.serviceArea?.name ?? null,
        statusHistory: booking.statusHistory.map((h) => ({
          old_status: h.oldStatus,
          new_status: h.newStatus,
          note: h.note,
          created_at: h.createdAt.toISOString(),
          changed_by_name: h.changedBy?.name ?? null,
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
  }
});

export const PATCH = adminApiHandler('bookings:write', async (req: NextRequest, session: SessionData) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Status tidak valid', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUniqueOrThrow({ where: { id } });

    if (booking.status === parsed.data.status) {
      return NextResponse.json({ data: { status: booking.status } });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          oldStatus: booking.status,
          newStatus: parsed.data.status,
          changedByAdminId: session.adminId,
          note: parsed.data.note,
        },
      });
      return tx.booking.update({
        where: { id },
        data: { status: parsed.data.status },
      });
    });

    return NextResponse.json({ data: { status: updated.status } });
  } catch {
    return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
  }
});
