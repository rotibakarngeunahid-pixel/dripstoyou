import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import TreatmentDetailContent from '@/components/public/TreatmentDetailContent';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, serviceJsonLd, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo';
import { toDirectImageUrl, toPublicImageUrl } from '@/lib/images';

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
    const product: Product | null = json.data ?? null;
    if (!product) return null;
    return { ...product, image_url: toDirectImageUrl(product.image_url) };
  } catch {
    return null;
  }
}

function metaDescription(product: Product): string {
  const fallback = `Book the ${product.name} drip in Bali — mobile IV therapy delivered to your villa, hotel, or home by a certified medical team. Book online in minutes.`;
  const source = product.short_description?.trim();
  if (!source) return fallback;
  // Keep descriptions within the 140–160 character sweet spot.
  if (source.length <= 160 && source.length >= 80) return source;
  if (source.length > 160) return `${source.slice(0, 157).trimEnd()}…`;
  return `${source} Delivered to your villa, hotel, or home in Bali — book online.`.slice(0, 160);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Not Found' };

  const url = `${SITE_URL}/treatments/${slug}`;
  const title = `${product.name} — Mobile IV Therapy Bali | Drips To You`;
  const description = metaDescription(product);
  const ogImage = toPublicImageUrl(product.image_url) ?? DEFAULT_OG_IMAGE;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Drips To You - Bali',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${product.name} IV Therapy Bali - Drips To You` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
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

  const jsonLd = serviceJsonLd({
    name: product.name,
    slug: product.slug,
    description: product.short_description,
    image: toPublicImageUrl(product.image_url),
    price: product.price_amount,
    currency: product.currency,
  });

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: 'Treatments', url: `${SITE_URL}/treatments` },
    { name: product.name, url: `${SITE_URL}/treatments/${product.slug}` },
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumb} />
      <Header />
      <TreatmentDetailContent product={product} waNumber={waNumber} />
      <SiteFooter waNumber={waNumber} />
      <ScrollRevealInit />
    </>
  );
}
