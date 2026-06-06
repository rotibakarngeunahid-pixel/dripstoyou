import { NextResponse } from 'next/server';
import { adminApiHandler } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeDecrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const GET = adminApiHandler('bookings:read', async () => {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true } },
      serviceArea: { select: { name: true } },
    },
  });

  const header = [
    'Kode Booking', 'Nama Pelanggan', 'No HP', 'Tanggal Booking', 'Waktu',
    'Jumlah Orang', 'Treatment', 'Tipe Lokasi', 'Area', 'Alamat', 'Status', 'Dibuat',
  ].map(csvEscape).join(',');

  const rows = bookings.map((b) => {
    const phone = safeDecrypt(b.customerPhoneEncrypted, `...${b.customerPhoneLast4}`);
    const address = safeDecrypt(b.addressEncrypted, '');
    return [
      b.bookingCode,
      b.customerName,
      phone,
      b.bookingDate.toISOString().split('T')[0],
      b.bookingTime,
      String(b.peopleCount),
      b.product.name,
      b.locationType,
      b.serviceArea?.name ?? '',
      address,
      b.status,
      b.createdAt.toISOString(),
    ].map(csvEscape).join(',');
  });

  const csv = [header, ...rows].join('\n');
  const filename = `bookings-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
