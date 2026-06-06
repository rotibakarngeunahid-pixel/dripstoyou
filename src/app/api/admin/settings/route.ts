import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';
import { SessionData } from '@/lib/session';

export const dynamic = 'force-dynamic';

const SETTINGS_KEYS = ['whatsapp_number', 'business_hours', 'response_time_minutes', 'site_name', 'site_email'] as const;

const PatchSchema = z.object({
  whatsapp_number: z.string().optional(),
  business_hours: z.string().optional(),
  response_time_minutes: z.string().optional(),
  site_name: z.string().optional(),
  site_email: z.string().email().optional().or(z.literal('')),
});

export const GET = adminApiHandler(null, async () => {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...SETTINGS_KEYS] } },
  });
  const data: Record<string, string> = {};
  for (const row of rows) {
    data[row.key] = row.valueEncryptedOrJson;
  }
  return NextResponse.json({ data });
});

export const PATCH = adminApiHandler(null, async (req: NextRequest, session: SessionData) => {
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }

  const entries = Object.entries(parsed.data).filter(([, v]) => v !== undefined) as [string, string][];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { valueEncryptedOrJson: value, updatedByAdminId: session.adminId },
        create: { key, valueEncryptedOrJson: value, updatedByAdminId: session.adminId },
      })
    )
  );

  return NextResponse.json({ success: true });
});
