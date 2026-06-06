import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get('slug');
  const includeBenefits = searchParams.get('include_benefits') === '1';
  const includeFaqs = searchParams.get('include_faqs') === '1';
  const featuredOnly = searchParams.get('featured') === '1' || searchParams.get('show_on_homepage') === '1';

  if (slug) {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: { select: { name: true, slug: true } },
        benefits: includeBenefits ? { orderBy: { sortOrder: 'asc' } } : false,
        faqs: includeFaqs ? { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } : false,
      },
    });
    if (!product) return NextResponse.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'OK', data: toPublic(product, includeBenefits, includeFaqs) });
  }

  const products = await prisma.product.findMany({
    where: { isActive: true, ...(featuredOnly ? { showOnHomepage: true } : {}) },
    orderBy: featuredOnly
      ? [{ homepageOrder: 'asc' }, { createdAt: 'asc' }]
      : [{ createdAt: 'asc' }],
    include: {
      category: { select: { name: true, slug: true } },
      benefits: includeBenefits ? { orderBy: { sortOrder: 'asc' } } : false,
    },
  });

  return NextResponse.json({ success: true, message: 'OK', data: products.map((p) => toPublic(p, includeBenefits, false)) });
}

function toPublic(
  p: {
    id: string; name: string; slug: string; shortDescription: string | null;
    fullDescription: string | null; priceAmount: number; priceLabel: string | null;
    durationMinutes: number | null; imageUrl: string | null; label: string | null;
    isActive: boolean; showOnHomepage: boolean; homepageOrder: number;
    category?: { name: string; slug: string } | null;
    benefits?: { benefitText: string; sortOrder: number }[];
    faqs?: { question: string; answer: string; sortOrder: number }[];
  },
  includeBenefits: boolean,
  includeFaqs: boolean,
) {
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
    show_on_homepage: p.showOnHomepage,
    homepage_order: p.homepageOrder,
    category_name: p.category?.name ?? null,
    category_slug: p.category?.slug ?? null,
    ...(includeBenefits && p.benefits
      ? { benefits: p.benefits.map((b) => ({ benefit_text: b.benefitText })) }
      : {}),
    ...(includeFaqs && p.faqs
      ? { faqs: p.faqs.map((f) => ({ question: f.question, answer: f.answer })) }
      : {}),
  };
}
