import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

const BookingSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(8).max(20),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  bookingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
  peopleCount: z.number().int().min(1).max(10).default(1),
  locationType: z.enum(['VILLA', 'HOTEL', 'RUMAH', 'AIRBNB', 'LAINNYA']),
  serviceAreaId: z.string().nullable().optional(),
  address: z.string().min(1).max(500),
  notes: z.string().max(1000).optional().nullable(),
});

function generateBookingCode(): string {
  const now = new Date();
  const prefix = 'DTY';
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${yy}${mm}${dd}${rand}`;
}

function getPhoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      message: 'Data tidak valid',
      errors: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const data = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: data.productId, isActive: true },
  });
  if (!product) {
    return NextResponse.json({ success: false, message: 'Treatment tidak ditemukan' }, { status: 404 });
  }

  if (data.serviceAreaId) {
    const area = await prisma.serviceArea.findFirst({
      where: { id: data.serviceAreaId, isActive: true },
    });
    if (!area) {
      return NextResponse.json({ success: false, message: 'Area layanan tidak ditemukan' }, { status: 404 });
    }
  }

  let phoneEncrypted: string;
  let addressEncrypted: string;
  let notesEncrypted: string | null = null;

  try {
    phoneEncrypted = encrypt(data.customerPhone);
    addressEncrypted = encrypt(data.address);
    if (data.notes) notesEncrypted = encrypt(data.notes);
  } catch {
    return NextResponse.json({ success: false, message: 'Gagal memproses data sensitif' }, { status: 500 });
  }

  let bookingCode = generateBookingCode();
  let attempts = 0;
  while (attempts < 5) {
    const exists = await prisma.booking.findFirst({ where: { bookingCode } });
    if (!exists) break;
    bookingCode = generateBookingCode();
    attempts++;
  }

  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      productId: data.productId,
      customerName: data.customerName,
      customerPhoneEncrypted: phoneEncrypted,
      customerPhoneLast4: getPhoneLast4(data.customerPhone),
      bookingDate: new Date(`${data.bookingDate}T00:00:00`),
      bookingTime: data.bookingTime,
      peopleCount: data.peopleCount,
      locationType: data.locationType,
      serviceAreaId: data.serviceAreaId ?? null,
      addressEncrypted,
      notesEncrypted,
      status: 'BARU',
      source: 'WEBSITE',
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Booking berhasil dibuat',
    data: {
      bookingCode: booking.bookingCode,
      bookingDate: data.bookingDate,
      bookingTime: booking.bookingTime,
      productName: product.name,
    },
  }, { status: 201 });
}
