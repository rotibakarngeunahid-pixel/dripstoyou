import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import AboutContent from '@/components/public/AboutContent';
import { getWaNumber } from '@/lib/whatsapp';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo';

export const revalidate = 60;

const PAGE_URL = `${SITE_URL}/about`;
const DESCRIPTION = 'Meet the certified medical team behind Drips To You - Bali, delivering safe mobile IV therapy to villas, hotels, and homes across Bali. Get to know us.';

export const metadata: Metadata = {
  title: 'About Us — Mobile IV Therapy Bali',
  description: DESCRIPTION,
  openGraph: {
    title: 'About Us | Drips To You - Bali',
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | Drips To You - Bali',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: { canonical: PAGE_URL },
};

type Area = { id: string; name: string };

async function getAreas(): Promise<Area[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return [];
  try {
    const res = await fetch(`${base}/areas.php`, {
      next: { revalidate: 60 },
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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: 'About Us', url: PAGE_URL },
        ])}
      />
      <Header />
      <AboutContent waNumber={waNumber} areas={areas} />
      <SiteFooter />
    </>
  );
}
