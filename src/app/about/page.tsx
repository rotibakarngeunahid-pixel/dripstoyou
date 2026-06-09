import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import AboutContent from '@/components/public/AboutContent';
import { getWaNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Us | Drips To You - Bali Mobile IV Therapy',
  description: 'Meet the Drips To You - Bali team. Certified medical professionals delivering IV therapy to villas, hotels, and homes across Bali.',
  openGraph: {
    title: 'About Drips To You - Bali',
    description: 'Certified medical professionals delivering mobile IV therapy across Bali. Learn about our team and service areas.',
    url: 'https://dripstoyou.com/about',
  },
  alternates: { canonical: 'https://dripstoyou.com/about' },
};

type Area = { id: string; name: string };

async function getAreas(): Promise<Area[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return [];
  try {
    const res = await fetch(`${base}/areas.php`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data)
      ? json.data.map((area: Area) => ({ id: area.id, name: area.name }))
      : [];
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const areas = await getAreas();
  const waNumber = getWaNumber();

  return (
    <>
      <Header />
      <AboutContent waNumber={waNumber} areas={areas} />
      <SiteFooter />
    </>
  );
}
