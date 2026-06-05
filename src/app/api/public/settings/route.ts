import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: { in: ['whatsapp_number', 'business_hours', 'response_time_minutes'] },
    },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.valueEncryptedOrJson;
  }

  return NextResponse.json({
    whatsappNumber:       map.whatsapp_number ?? process.env.WHATSAPP_NUMBER ?? '6281200000000',
    businessHours:        map.business_hours ?? '08:00-22:00',
    responseTimeMinutes:  parseInt(map.response_time_minutes ?? '60', 10),
  });
}
