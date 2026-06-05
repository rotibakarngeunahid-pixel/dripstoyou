import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = querySchema.safeParse({ date: searchParams.get('date') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 });
  }

  const date = new Date(parsed.data.date);
  const dayOfWeek = date.getDay();

  const [schedule, blocked] = await Promise.all([
    prisma.scheduleSetting.findUnique({ where: { dayOfWeek } }),
    prisma.blockedDate.findFirst({
      where: { date, isFullDay: true },
    }),
  ]);

  if (!schedule || !schedule.isOpen || blocked) {
    return NextResponse.json({ available: false, slots: [] });
  }

  const [openH, openM] = schedule.openTime.split(':').map(Number);
  const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const slots: string[] = [];
  for (let m = openMinutes; m < closeMinutes; m += schedule.slotDurationMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  const bookingCounts = await prisma.booking.groupBy({
    by: ['bookingTime'],
    where: {
      bookingDate: date,
      status: { notIn: ['DIBATALKAN'] },
    },
    _count: { bookingTime: true },
  });

  const countMap = new Map(bookingCounts.map((b) => [b.bookingTime, b._count.bookingTime]));

  const availableSlots = slots.filter(
    (s) => (countMap.get(s) ?? 0) < schedule.maxBookingsPerSlot
  );

  return NextResponse.json({ available: availableSlots.length > 0, slots: availableSlots });
}
