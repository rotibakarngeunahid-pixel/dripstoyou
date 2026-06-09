import Header from '@/components/public/Header';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import HomeContent from '@/components/public/HomeContent';
import SiteFooter from '@/components/public/SiteFooter';
import type { HomepageProduct, ServiceAreaData } from '@/components/public/HomeContent';
import { parseOperatingHours, toSchemaOpeningHours } from '@/lib/operatingHours';

export const revalidate = 60;

type PublicSettings = { whatsappNumber?: string; businessHours?: string };

async function getPublicSettings(): Promise<PublicSettings | null> {
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

async function getHomepageProducts(): Promise<HomepageProduct[]> {
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) return [];
  try {
    const res = await fetch(`${phpBase}/products.php`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const all: HomepageProduct[] = Array.isArray(json.data) ? json.data : [];
    return all
      .filter((p) => p.show_on_homepage)
      .sort((a, b) => (a.homepage_order ?? 99) - (b.homepage_order ?? 99));
  } catch {
    return [];
  }
}

async function getServiceAreas(): Promise<ServiceAreaData[]> {
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) return [];
  try {
    const res = await fetch(`${phpBase}/areas.php`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json.data)) return [];
    return json.data.map((area: {
      id: string;
      name: string;
      estimated_arrival_minutes: number | null;
      note: string | null;
    }, index: number) => ({
      id: area.id,
      name: area.name,
      isActive: true,
      estimatedArrivalMinutes: area.estimated_arrival_minutes,
      note: area.note,
      sortOrder: index,
    }));
  } catch {
    return [];
  }
}

const JSON_LD_BASE = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Drips To You - Bali',
  description: 'Mobile IV therapy and wellness service delivered to villas, hotels, and homes in Bali.',
  url: 'https://dripstoyou.com',
  telephone: '+62812-0000-0000',
  email: 'hello@dripstoyou.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bali',
    addressCountry: 'ID',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -8.4095,
    longitude: 115.1889,
  },
  priceRange: '$$',
  areaServed: { '@type': 'Place', name: 'Bali, Indonesia' },
  sameAs: ['https://instagram.com/dripstoyou'],
  serviceType: 'IV Therapy, Mobile IV Drip, Wellness',
  medicalSpecialty: 'IV Hydration Therapy',
};

export default async function HomePage() {
  const [settings, homepageProducts, serviceAreas] = await Promise.all([
    getPublicSettings(),
    getHomepageProducts(),
    getServiceAreas(),
  ]);

  const waNumber =
    (settings?.whatsappNumber as string | undefined) ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    '6281200000000';

  const openingHours = toSchemaOpeningHours(
    parseOperatingHours(settings?.businessHours ?? null),
  );

  const jsonLd = { ...JSON_LD_BASE, openingHours };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <ScrollRevealInit />
      <HomeContent waNumber={waNumber} homepageProducts={homepageProducts} serviceAreas={serviceAreas} />
      <SiteFooter waNumber={waNumber} />
    </>
  );
}
