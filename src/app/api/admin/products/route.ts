import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().max(500).optional(),
  fullDescription: z.string().optional(),
  priceAmount: z.number().int().min(0),
  priceLabel: z.string().max(100).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  imageUrl: z.string().url().max(500).optional(),
  label: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  showOnHomepage: z.boolean().default(false),
  homepageOrder: z.number().int().default(0),
  categoryId: z.string().optional(),
  benefits: z.array(z.string().min(1).max(500)).default([]),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: [{ homepageOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { name: true } },
      benefits: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { bookings: true } },
    },
  });

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });

  const { benefits, ...data } = parsed.data;

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });

  const product = await prisma.product.create({
    data: {
      ...data,
      benefits: {
        create: benefits.map((text, i) => ({ benefitText: text, sortOrder: i })),
      },
    },
    include: { benefits: true },
  });

  await auditLog({
    actorAdminId: session.adminId,
    action: 'CREATE_PRODUCT',
    entityType: 'Product',
    entityId: product.id,
    metadata: { name: product.name },
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ product }, { status: 201 });
}
