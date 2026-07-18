import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import TreatmentsContent from '@/components/public/TreatmentsContent';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo';
import { toDirectImageUrl } from '@/lib/images';

export const revalidate = 60;

const PAGE_URL = `${SITE_URL}/treatments`;
const DESCRIPTION = 'Browse mobile IV drips in Bali — hangover recovery, Bali belly relief, immune and energy boosts delivered to your villa or hotel. See prices, book online.';

export const metadata: Metadata = {
  title: 'IV Therapy Treatments in Bali',
  description: DESCRIPTION,
  openGraph: {
    title: 'IV Therapy Treatments in Bali | Drips To You - Bali',
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IV Therapy Treatments in Bali | Drips To You - Bali',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: { canonical: PAGE_URL },
};

interface Benefit {
  id: string;
  benefit_text: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price_amount: number;
  currency: string | null;
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  label: string | null;
  show_on_homepage: boolean;
  benefits: Benefit[];
  prices?: Record<string, number>;
}

async function getProducts(): Promise<Product[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return [];

  try {
    const res = await fetch(
      `${apiBase}/products.php?include_benefits=1`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const products: Product[] = Array.isArray(json.data) ? json.data : [];
    return products.map((p) => ({ ...p, image_url: toDirectImageUrl(p.image_url) }));
  } catch {
    return [];
  }
}

export default async function TreatmentsPage() {
  const products = await getProducts();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: 'Treatments', url: PAGE_URL },
        ])}
      />
      <Header />
      <TreatmentsContent products={products} />
      <SiteFooter />
    </>
  );
}
