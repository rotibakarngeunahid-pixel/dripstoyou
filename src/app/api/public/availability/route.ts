import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const dateStr = req.nextUrl.searchParams.get('date') ?? '';
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ success: false, message: 'Format tanggal tidak valid (YYYY-MM-DD)' }, { status: 400 });
  }

  const date = new Date(`${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ success: false, message: 'Tanggal tidak valid' }, { status: 400 });
  }

  const dayOfWeek = date.getDay();

  const [schedule, blockedDate] = await Promise.all([
    prisma.scheduleSetting.findUnique({ where: { dayOfWeek } }),
    prisma.blockedDate.findFirst({
      where: {
        date: { gte: new Date(`${dateStr}T00:00:00`), lt: new Date(`${dateStr}T23:59:59`) },
        isFullDay: true,
      },
    }),
  ]);

  if (!schedule || !schedule.isOpen || blockedDate) {
    return NextResponse.json({ success: true, message: 'OK', data: { available: false, slots: [] } });
  }

  const slots: string[] = [];
  const [openH, openM] = schedule.openTime.split(':').map(Number);
  const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const now = new Date();
  const isToday = dateStr === now.toISOString().split('T')[0];
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + schedule.minPrebookingMinutes : 0;

  for (let m = openMinutes; m < closeMinutes; m += schedule.slotDurationMinutes) {
    if (m < nowMinutes) continue;
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    slots.push(`${h}:${min}`);
  }

  return NextResponse.json({ success: true, message: 'OK', data: { available: slots.length > 0, slots } });
}
