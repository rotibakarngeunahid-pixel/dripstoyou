import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  whatsapp_number: z.string().regex(/^\d{10,15}$/).optional(),
  business_hours: z.string().max(50).optional(),
  response_time_minutes: z.string().regex(/^\d+$/).optional(),
  site_name: z.string().max(100).optional(),
  site_email: z.string().email().max(255).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.siteSetting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.valueEncryptedOrJson;
  }
  return NextResponse.json({ settings: map });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });

  const entries = Object.entries(parsed.data).filter(([, v]) => v !== undefined) as [string, string][];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { valueEncryptedOrJson: value, updatedByAdminId: session.adminId! },
        create: { key, valueEncryptedOrJson: value, updatedByAdminId: session.adminId! },
      })
    )
  );

  await auditLog({
    actorAdminId: session.adminId,
    action: 'UPDATE_WHATSAPP',
    entityType: 'SiteSetting',
    metadata: { keys: entries.map(([k]) => k) },
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
