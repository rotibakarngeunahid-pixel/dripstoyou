import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ homepageOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      priceAmount: true,
      priceLabel: true,
      durationMinutes: true,
      imageUrl: true,
      label: true,
      showOnHomepage: true,
      homepageOrder: true,
      category: { select: { name: true, slug: true } },
      benefits: { select: { benefitText: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  return NextResponse.json({ products });
}
