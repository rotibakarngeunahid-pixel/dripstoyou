import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  category: z.string().min(1).max(100).default('General'),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const GET = adminApiHandler('content:read', async () => {
  const faqs = await prisma.faq.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json({ data: faqs });
});

export const POST = adminApiHandler('content:write', async (req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }
  const faq = await prisma.faq.create({ data: parsed.data });
  return NextResponse.json({ data: faq }, { status: 201 });
});
