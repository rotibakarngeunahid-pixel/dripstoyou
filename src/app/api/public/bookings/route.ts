import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';

const bookingSchema = z.object({
  productId:    z.string().min(1),
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Invalid phone number'),
  bookingDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bookingTime:  z.string().regex(/^\d{2}:\d{2}$/),
  peopleCount:  z.number().int().min(1).max(10).default(1),
  locationType: z.enum(['VILLA', 'HOTEL', 'RUMAH', 'AIRBNB', 'LAINNYA']),
  serviceAreaId: z.string().optional(),
  address:      z.string().min(5).max(500),
  notes:        z.string().max(1000).optional(),
});

function generateBookingCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DRY${yy}${mm}${dd}${rand}`;
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, 'booking', RATE_LIMITS.BOOKING.limit, RATE_LIMITS.BOOKING.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many booking requests. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: data.productId, isActive: true },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
  }

  const phone = data.customerPhone.replace(/\D/g, '');
  const phoneLast4 = phone.slice(-4);

  const booking = await prisma.booking.create({
    data: {
      bookingCode:            generateBookingCode(),
      productId:              data.productId,
      customerName:           data.customerName,
      customerPhoneEncrypted: encrypt(phone),
      customerPhoneLast4:     phoneLast4,
      bookingDate:            new Date(data.bookingDate),
      bookingTime:            data.bookingTime,
      peopleCount:            data.peopleCount,
      locationType:           data.locationType,
      serviceAreaId:          data.serviceAreaId ?? null,
      addressEncrypted:       encrypt(data.address),
      notesEncrypted:         data.notes ? encrypt(data.notes) : null,
      source:                 'WEBSITE',
    },
    select: {
      bookingCode: true,
      bookingDate: true,
      bookingTime: true,
      product: { select: { name: true } },
    },
  });

  await auditLog({
    action:     'CREATE_BOOKING',
    entityType: 'Booking',
    entityId:   booking.bookingCode,
    metadata:   { product: booking.product.name, phoneLast4 },
    ip:         req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({
    success: true,
    bookingCode: booking.bookingCode,
    message: 'Booking berhasil dibuat. Tim kami akan menghubungi kamu segera.',
  }, { status: 201 });
}
