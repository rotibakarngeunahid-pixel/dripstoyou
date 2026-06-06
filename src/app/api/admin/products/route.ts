import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().max(500).optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  priceAmount: z.number().int().nonnegative(),
  priceLabel: z.string().max(100).optional().nullable(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  label: z.string().max(50).optional().nullable(),
  isActive: z.boolean().default(true),
  showOnHomepage: z.boolean().default(false),
  homepageOrder: z.number().int().default(0),
  benefits: z.array(z.string().min(1)).default([]),
});

function toSnake(p: {
  id: string; name: string; slug: string; shortDescription: string | null;
  fullDescription: string | null; priceAmount: number; priceLabel: string | null;
  durationMinutes: number | null; imageUrl: string | null; label: string | null;
  isActive: boolean; showOnHomepage: boolean; homepageOrder: number;
  category?: { name: string } | null;
  benefits?: { benefitText: string }[];
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
    benefits: p.benefits?.map((b) => ({ benefit_text: b.benefitText })) ?? [],
  };
}

export const GET = adminApiHandler('products:read', async () => {
  const products = await prisma.product.findMany({
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });
  return NextResponse.json({ data: products.map(toSnake) });
});

export const POST = adminApiHandler('products:write', async (req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten() }, { status: 400 });
  }

  const { benefits, ...productData } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        ...productData,
        benefits: {
          create: benefits.map((text, i) => ({ benefitText: text, sortOrder: i })),
        },
      },
      include: {
        category: { select: { name: true } },
        benefits: true,
        _count: { select: { bookings: true } },
      },
    });
    return NextResponse.json({ data: toSnake(product) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 });
  }
});
