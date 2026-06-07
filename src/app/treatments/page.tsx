import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import TreatmentsContent from '@/components/public/TreatmentsContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Treatments - Drips To You - Bali | Mobile IV Therapy',
  description: 'Browse our IV therapy treatments in Bali: Hangover Recovery, Immune Booster, Energy Boost, and Beauty Glow. Delivered to your villa or hotel.',
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
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  label: string | null;
  show_on_homepage: boolean;
  benefits: Benefit[];
  faqs: { id: string; question: string; answer: string }[];
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1', name: 'Hangover Recovery', slug: 'hangover-recovery',
    short_description: 'Rehidrasi cepat dengan kombinasi elektrolit, vitamin B kompleks, dan anti-mual untuk pemulihan optimal.',
    price_amount: 750000, price_label: 'IDR 750.000', duration_minutes: 45,
    image_url: 'https://images.pexels.com/photos/6010930/pexels-photo-6010930.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'Popular', show_on_homepage: true,
    benefits: [{ id: '1a', benefit_text: 'Rehidrasi cepat', sort_order: 1 }, { id: '1b', benefit_text: 'Vitamin B & C', sort_order: 2 }, { id: '1c', benefit_text: 'Anti-mual', sort_order: 3 }],
    faqs: [],
  },
  {
    id: '2', name: 'Immune Booster', slug: 'immune-booster',
    short_description: 'Tingkatkan sistem imun dengan vitamin C dosis tinggi, zinc, dan glutathione untuk perlindungan optimal.',
    price_amount: 650000, price_label: 'IDR 650.000', duration_minutes: 60,
    image_url: 'https://images.pexels.com/photos/6010936/pexels-photo-6010936.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'Best Seller', show_on_homepage: true,
    benefits: [{ id: '2a', benefit_text: 'Vitamin C dosis tinggi', sort_order: 1 }, { id: '2b', benefit_text: 'Zinc & Glutathione', sort_order: 2 }, { id: '2c', benefit_text: 'Peningkatan imunitas', sort_order: 3 }],
    faqs: [],
  },
  {
    id: '3', name: 'Energy Boost', slug: 'energy-boost',
    short_description: 'Kembalikan stamina dan energi dengan B-complex, magnesium, dan elektrolit lengkap.',
    price_amount: 550000, price_label: 'IDR 550.000', duration_minutes: 45,
    image_url: 'https://images.pexels.com/photos/11081177/pexels-photo-11081177.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: null, show_on_homepage: true,
    benefits: [{ id: '3a', benefit_text: 'B-complex penuh', sort_order: 1 }, { id: '3b', benefit_text: 'Magnesium', sort_order: 2 }, { id: '3c', benefit_text: 'Elektrolit lengkap', sort_order: 3 }],
    faqs: [],
  },
  {
    id: '4', name: 'Beauty Glow', slug: 'beauty-glow',
    short_description: 'Tampil lebih cerah dengan glutathione, peningkat kolagen, dan antioksidan premium.',
    price_amount: 700000, price_label: 'IDR 700.000', duration_minutes: 60,
    image_url: 'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'New', show_on_homepage: true,
    benefits: [{ id: '4a', benefit_text: 'Glutathione', sort_order: 1 }, { id: '4b', benefit_text: 'Peningkat kolagen', sort_order: 2 }, { id: '4c', benefit_text: 'Antioksidan premium', sort_order: 3 }],
    faqs: [],
  },
];

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/products.php?include_benefits=1&include_faqs=1`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return FALLBACK_PRODUCTS;
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    return data.length > 0 ? data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
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
