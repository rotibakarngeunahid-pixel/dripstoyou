import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const PLATFORM_VALUES = ['WHATSAPP','INSTAGRAM','TIKTOK','FACEBOOK','GOOGLE_MAPS','EMAIL','WEBSITE','CUSTOM'] as const;

const UpdateSchema = z.object({
  platform: z.enum(PLATFORM_VALUES).optional(),
  label: z.string().min(1).max(100).optional(),
  value: z.string().min(1).max(500).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
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

export const PUT = adminApiHandler('content:write', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const existing = await prisma.socialLink.findUniqueOrThrow({ where: { id } });
    const platform = parsed.data.platform ?? existing.platform;
    const value = parsed.data.value ?? existing.value;
    const normalizedUrl = buildNormalizedUrl(platform, value);
    const link = await prisma.socialLink.update({
      where: { id },
      data: { ...parsed.data, normalizedUrl },
    });
    return NextResponse.json({ data: link });
  } catch {
    return NextResponse.json({ error: 'Link tidak ditemukan' }, { status: 404 });
  }
});

export const DELETE = adminApiHandler('content:write', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  try {
    await prisma.socialLink.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Link tidak ditemukan' }, { status: 404 });
  }
});
