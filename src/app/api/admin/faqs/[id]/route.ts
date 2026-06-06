import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const PUT = adminApiHandler('content:write', async (req: NextRequest, _session) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const faq = await prisma.faq.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ data: faq });
  } catch {
    return NextResponse.json({ error: 'FAQ tidak ditemukan' }, { status: 404 });
  }
});

export const DELETE = adminApiHandler('content:write', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  try {
    await prisma.faq.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'FAQ tidak ditemukan' }, { status: 404 });
  }
});
