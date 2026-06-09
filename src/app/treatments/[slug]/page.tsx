import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import TreatmentDetailContent from '@/components/public/TreatmentDetailContent';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';

export const revalidate = 60;

interface Benefit {
  id: string;
  benefit_text: string;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  price_amount: number;
  currency: string | null;
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  label: string | null;
  benefits: Benefit[];
  faqs: Faq[];
}

async function getPublicSettings(): Promise<{ whatsappNumber?: string } | null> {
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) return null;
  try {
    const res = await fetch(`${phpBase}/settings.php`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/products.php?slug=${encodeURIComponent(slug)}&include_benefits=1&include_faqs=1`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Not Found' };

  const url = `https://dripstoyou.com/treatments/${slug}`;
  const ogImages = product.image_url
    ? [{ url: product.image_url, width: 1200, height: 630, alt: product.name }]
    : [];

  return {
    title: `${product.name} | Mobile IV Therapy Bali`,
    description: product.short_description ?? `Book ${product.name} mobile IV therapy in Bali. Certified medical team delivered to your villa, hotel or home.`,
    openGraph: {
      title: `${product.name} - Drips To You Bali`,
      description: product.short_description ?? undefined,
      url,
      images: ogImages,
    },
    alternates: { canonical: url },
  };
}

export default async function TreatmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProduct(slug),
    getPublicSettings(),
  ]);

  if (!product) notFound();

  const waNumber =
    (settings?.whatsappNumber as string | undefined) ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    '6281200000000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: product.name,
    description: product.short_description ?? undefined,
    provider: {
      '@type': 'MedicalBusiness',
      name: 'Drips To You - Bali',
      url: 'https://dripstoyou.com',
    },
    areaServed: { '@type': 'Place', name: 'Bali, Indonesia' },
    ...(product.image_url ? { image: product.image_url } : {}),
    ...(product.price_amount ? { offers: { '@type': 'Offer', price: product.price_amount, priceCurrency: product.currency ?? 'IDR' } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <TreatmentDetailContent product={product} waNumber={waNumber} />
      <SiteFooter waNumber={waNumber} />
      <ScrollRevealInit />
    </>
  );
}
