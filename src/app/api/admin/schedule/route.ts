import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMinutes: z.number().int().min(15).max(480),
  maxBookingsPerSlot: z.number().int().min(1).max(20),
  minPrebookingMinutes: z.number().int().min(0),
});

const updateSchema = z.array(daySchema);

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const schedule = await prisma.scheduleSetting.findMany({ orderBy: { dayOfWeek: 'asc' } });
  return NextResponse.json({ schedule });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });

  await prisma.$transaction(
    parsed.data.map((day) =>
      prisma.scheduleSetting.upsert({
        where: { dayOfWeek: day.dayOfWeek },
        update: day,
        create: day,
      })
    )
  );

  await auditLog({
    actorAdminId: session.adminId,
    action: 'UPDATE_SCHEDULE',
    entityType: 'ScheduleSetting',
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  const schedule = await prisma.scheduleSetting.findMany({ orderBy: { dayOfWeek: 'asc' } });
  return NextResponse.json({ schedule });
}
