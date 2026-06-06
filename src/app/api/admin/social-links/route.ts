import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const PLATFORM_VALUES = ['WHATSAPP','INSTAGRAM','TIKTOK','FACEBOOK','GOOGLE_MAPS','EMAIL','WEBSITE','CUSTOM'] as const;

const CreateSchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

function buildNormalizedUrl(platform: string, value: string): string | null {
  try {
    switch (platform) {
      case 'WHATSAPP': {
        const canonical = normalizeWhatsAppNumber(value);
        return `https://wa.me/${canonical}`;
      }
      case 'INSTAGRAM':
        if (value.startsWith('http')) return value;
        return `https://instagram.com/${value.replace('@', '')}`;
      case 'TIKTOK':
        if (value.startsWith('http')) return value;
        return `https://tiktok.com/@${value.replace('@', '')}`;
      case 'EMAIL':
        return `mailto:${value}`;
      default:
        return value.startsWith('http') ? value : `https://${value}`;
    }
  } catch {
    return null;
  }
}

export const GET = adminApiHandler('content:read', async () => {
  const links = await prisma.socialLink.findMany({
    orderBy: [{ sortOrder: 'asc' }],
  });
  return NextResponse.json({ data: links });
});

export const POST = adminApiHandler('content:write', async (req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }
  const normalizedUrl = buildNormalizedUrl(parsed.data.platform, parsed.data.value);
  const link = await prisma.socialLink.create({
    data: { ...parsed.data, normalizedUrl },
  });
  return NextResponse.json({ data: link }, { status: 201 });
});
