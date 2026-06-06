import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMinutes: z.number().int().min(15).max(480),
  maxBookingsPerSlot: z.number().int().min(1).max(20),
  minPrebookingMinutes: z.number().int().min(0),
});

function toApiFormat(s: {
  dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string;
  slotDurationMinutes: number; maxBookingsPerSlot: number; minPrebookingMinutes: number;
}) {
  return {
    day_of_week: s.dayOfWeek,
    is_open: s.isOpen,
    open_time: s.openTime,
    close_time: s.closeTime,
    slot_duration_minutes: s.slotDurationMinutes,
    max_bookings_per_slot: s.maxBookingsPerSlot,
    min_prebooking_minutes: s.minPrebookingMinutes,
  };
}

const DEFAULT_SCHEDULE = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isOpen: i >= 1 && i <= 6,
  openTime: '08:00',
  closeTime: '22:00',
  slotDurationMinutes: 60,
  maxBookingsPerSlot: 3,
  minPrebookingMinutes: 120,
}));

export const GET = adminApiHandler('schedule:read', async () => {
  const settings = await prisma.scheduleSetting.findMany({
    orderBy: { dayOfWeek: 'asc' },
  });

  if (settings.length === 0) {
    await prisma.scheduleSetting.createMany({ data: DEFAULT_SCHEDULE });
    return NextResponse.json({ data: DEFAULT_SCHEDULE.map(toApiFormat) });
  }

  const dayMap = new Map(settings.map((s) => [s.dayOfWeek, s]));
  const result = DEFAULT_SCHEDULE.map((def) => toApiFormat(dayMap.get(def.dayOfWeek) ?? def));
  return NextResponse.json({ data: result });
});

export const PUT = adminApiHandler('schedule:write', async (req: NextRequest) => {
  const body = await req.json();
  const parsed = z.array(DaySchema).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Format jadwal tidak valid', details: parsed.error.flatten() }, { status: 400 });
  }

  const upserts = parsed.data.map((day) =>
    prisma.scheduleSetting.upsert({
      where: { dayOfWeek: day.dayOfWeek },
      update: {
        isOpen: day.isOpen,
        openTime: day.openTime,
        closeTime: day.closeTime,
        slotDurationMinutes: day.slotDurationMinutes,
        maxBookingsPerSlot: day.maxBookingsPerSlot,
        minPrebookingMinutes: day.minPrebookingMinutes,
      },
      create: day,
    })
  );

  const updated = await prisma.$transaction(upserts);
  updated.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  return NextResponse.json({ data: updated.map(toApiFormat) });
});
