import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import TreatmentDetailContent from '@/components/public/TreatmentDetailContent';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import { getWaNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

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
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  label: string | null;
  benefits: Benefit[];
  faqs: Faq[];
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/products.php?slug=${encodeURIComponent(slug)}&include_benefits=1&include_faqs=1`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
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

  return {
    title: `${product.name} - Drips To You - Bali`,
    description: product.short_description ?? undefined,
  };
}

export default async function TreatmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, waNumber] = await Promise.all([
    getProduct(slug),
    Promise.resolve(getWaNumber()),
  ]);

  if (!product) notFound();

  return (
    <>
      <Header />
      <TreatmentDetailContent product={product} waNumber={waNumber} />
      <SiteFooter />
      <ScrollRevealInit />
    </>
  );
}
