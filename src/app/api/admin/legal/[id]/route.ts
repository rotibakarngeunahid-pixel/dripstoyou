import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = adminApiHandler('content:read', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  try {
    const page = await prisma.legalPage.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ data: page });
  } catch {
    return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 });
  }
});

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
});

export const PUT = adminApiHandler('content:write', async (req: NextRequest, session) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const page = await prisma.legalPage.update({
      where: { id },
      data: { ...parsed.data, updatedByAdminId: session.adminId },
    });
    return NextResponse.json({ data: page });
  } catch {
    return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 });
  }
});
