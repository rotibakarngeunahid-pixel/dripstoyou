import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['whatsapp_number', 'business_hours', 'site_name', 'site_email', 'response_time_minutes'] } },
  });
  const data: Record<string, string> = {};
  for (const row of rows) {
    data[row.key] = row.valueEncryptedOrJson;
  }
  return NextResponse.json({ success: true, message: 'OK', data });
}
