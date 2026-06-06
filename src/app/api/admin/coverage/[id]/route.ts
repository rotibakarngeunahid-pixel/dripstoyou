import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  estimatedArrivalMinutes: z.number().int().positive().nullable().optional(),
  extraFeeAmount: z.number().int().nonnegative().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const PUT = adminApiHandler('areas:write', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const area = await prisma.serviceArea.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ data: area });
  } catch {
    return NextResponse.json({ error: 'Area tidak ditemukan' }, { status: 404 });
  }
});

export const DELETE = adminApiHandler('areas:write', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  try {
    await prisma.serviceArea.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Area tidak ditemukan' }, { status: 404 });
  }
});
