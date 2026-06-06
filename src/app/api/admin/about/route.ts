import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ABOUT_KEY = 'about_content';

const AboutSchema = z.object({
  heroTagline: z.string().max(200).optional(),
  heroParagraph: z.string().max(1000).optional(),
  missionStatement: z.string().max(500).optional(),
  teamIntro: z.string().max(500).optional(),
});

export type AboutContent = z.infer<typeof AboutSchema>;

export const GET = adminApiHandler('content:read', async () => {
  const setting = await prisma.siteSetting.findUnique({ where: { key: ABOUT_KEY } });
  const content: AboutContent = setting ? (JSON.parse(setting.valueEncryptedOrJson) as AboutContent) : {};
  return NextResponse.json({ data: content });
});

export const PUT = adminApiHandler('content:write', async (req: NextRequest, session) => {
  const body = await req.json();
  const parsed = AboutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.siteSetting.findUnique({ where: { key: ABOUT_KEY } });
  const prev: AboutContent = existing ? (JSON.parse(existing.valueEncryptedOrJson) as AboutContent) : {};
  const merged = { ...prev, ...parsed.data };

  await prisma.siteSetting.upsert({
    where: { key: ABOUT_KEY },
    create: { key: ABOUT_KEY, valueEncryptedOrJson: JSON.stringify(merged), updatedByAdminId: session.adminId },
    update: { valueEncryptedOrJson: JSON.stringify(merged), updatedByAdminId: session.adminId },
  });

  return NextResponse.json({ data: merged });
});
