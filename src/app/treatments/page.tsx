import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import TreatmentsContent from '@/components/public/TreatmentsContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Treatments - Drips To You - Bali | Mobile IV Therapy',
  description: 'Browse the active mobile IV therapy treatments configured by Drips To You - Bali.',
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
}

async function getProducts(): Promise<Product[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return [];

  try {
    const res = await fetch(
      `${apiBase}/products.php?include_benefits=1`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function TreatmentsPage() {
  const products = await getProducts();

  return (
    <>
      <Header />
      <TreatmentsContent products={products} />
      <SiteFooter />
    </>
  );
}
