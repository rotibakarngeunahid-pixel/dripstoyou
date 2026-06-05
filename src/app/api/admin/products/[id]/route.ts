import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  fullDescription: z.string().optional(),
  priceAmount: z.number().int().min(0).optional(),
  priceLabel: z.string().max(100).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  imageUrl: z.string().url().max(500).optional().nullable(),
  label: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
  homepageOrder: z.number().int().optional(),
  categoryId: z.string().optional().nullable(),
  benefits: z.array(z.string().min(1).max(500)).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, benefits: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });

  const { benefits, ...data } = parsed.data;

  const product = await prisma.$transaction(async (tx) => {
    if (benefits !== undefined) {
      await tx.productBenefit.deleteMany({ where: { productId: id } });
      if (benefits.length > 0) {
        await tx.productBenefit.createMany({
          data: benefits.map((text, i) => ({ productId: id, benefitText: text, sortOrder: i })),
        });
      }
    }
    return tx.product.update({
      where: { id },
      data,
      include: { benefits: { orderBy: { sortOrder: 'asc' } } },
    });
  });

  await auditLog({
    actorAdminId: session.adminId,
    action: 'UPDATE_PRODUCT',
    entityType: 'Product',
    entityId: id,
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.product.delete({ where: { id } });

  await auditLog({
    actorAdminId: session.adminId,
    action: 'DELETE_PRODUCT',
    entityType: 'Product',
    entityId: id,
    metadata: { name: product.name },
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
