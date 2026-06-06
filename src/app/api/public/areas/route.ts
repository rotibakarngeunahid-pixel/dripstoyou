import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const areas = await prisma.serviceArea.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      estimatedArrivalMinutes: true,
      extraFeeAmount: true,
      note: true,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'OK',
    data: areas.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      estimated_arrival_minutes: a.estimatedArrivalMinutes,
      extra_fee_amount: a.extraFeeAmount,
      note: a.note,
    })),
  });
}
