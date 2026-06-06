import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  shortDescription: z.string().max(500).optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  priceAmount: z.number().int().nonnegative().optional(),
  priceLabel: z.string().max(100).optional().nullable(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  label: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
  homepageOrder: z.number().int().optional(),
  benefits: z.array(z.string().min(1)).optional(),
});

function toSnake(p: {
  id: string; name: string; slug: string; shortDescription: string | null;
  fullDescription: string | null; priceAmount: number; priceLabel: string | null;
  durationMinutes: number | null; imageUrl: string | null; label: string | null;
  isActive: boolean; showOnHomepage: boolean; homepageOrder: number;
  category?: { name: string } | null;
  benefits?: { benefitText: string; sortOrder: number }[];
  _count?: { bookings: number };
}) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    short_description: p.shortDescription,
    full_description: p.fullDescription,
    price_amount: p.priceAmount,
    price_label: p.priceLabel,
    duration_minutes: p.durationMinutes,
    image_url: p.imageUrl,
    label: p.label,
    is_active: p.isActive,
    show_on_homepage: p.showOnHomepage,
    homepage_order: p.homepageOrder,
    category_name: p.category?.name ?? null,
    booking_count: p._count?.bookings ?? 0,
    benefits: p.benefits
      ?.sort((a, b) => a.sortOrder - b.sortOrder)
      .map((b) => ({ benefit_text: b.benefitText })) ?? [],
  };
}

export const GET = adminApiHandler('products:read', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  try {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        category: { select: { name: true } },
        benefits: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { bookings: true } },
      },
    });
    return NextResponse.json({ data: toSnake(product) });
  } catch {
    return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
  }
});

export const PATCH = adminApiHandler('products:write', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }

  const { benefits, ...productData } = parsed.data;

  try {
    const product = await prisma.$transaction(async (tx) => {
      if (benefits !== undefined) {
        await tx.productBenefit.deleteMany({ where: { productId: id } });
        await tx.productBenefit.createMany({
          data: benefits.map((text, i) => ({ productId: id, benefitText: text, sortOrder: i })),
        });
      }
      return tx.product.update({
        where: { id },
        data: productData,
        include: {
          category: { select: { name: true } },
          benefits: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { bookings: true } },
        },
      });
    });
    return NextResponse.json({ data: toSnake(product) });
  } catch {
    return NextResponse.json({ error: 'Produk tidak ditemukan atau slug duplikat' }, { status: 404 });
  }
});

export const DELETE = adminApiHandler('products:write', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
  }
});
