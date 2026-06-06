import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  isActive: z.boolean().default(true),
  estimatedArrivalMinutes: z.number().int().positive().nullable().optional(),
  extraFeeAmount: z.number().int().nonnegative().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const GET = adminApiHandler('areas:read', async () => {
  const areas = await prisma.serviceArea.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ data: areas });
});

export const POST = adminApiHandler('areas:write', async (req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const area = await prisma.serviceArea.create({ data: parsed.data });
    return NextResponse.json({ data: area }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 });
  }
});
