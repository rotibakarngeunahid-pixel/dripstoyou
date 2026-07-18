// Centralized SEO constants and schema.org JSON-LD builders.
// All builders return plain objects; render them with <JsonLd data={...} />.

export const SITE_URL = 'https://dripstoyou.com';
export const SITE_NAME = 'Drips To You - Bali';

export const DEFAULT_OG_IMAGE =
  'https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image/drips-to-you-bali-og.webp';
export const LOGO_URL =
  'https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image/drips-to-you-bali-icon.webp';

// Owner-confirmed business WhatsApp line (E.164, no spaces).
export const BUSINESS_PHONE = '+6282314046089';

export const PRICE_RANGE = 'Rp 1.500.000 - Rp 2.000.000';
export const DEFAULT_OPENING_HOURS = 'Mo-Su 08:00-22:00';

// Used when the live service-area list is unavailable at render time.
export const FALLBACK_AREAS = [
  'Seminyak', 'Canggu', 'Uluwatu', 'Nusa Dua', 'Ubud', 'Denpasar', 'Sanur',
];

const ORG_ID = `${SITE_URL}/#organization`;
const BUSINESS_ID = `${SITE_URL}/#business`;
const WEBSITE_ID = `${SITE_URL}/#website`;

type SocialLink = { platform?: string; normalizedUrl?: string | null };

// Live social profile URLs (Instagram/TikTok/Facebook) from the DB — never guessed.
export async function fetchSameAs(): Promise<string[]> {
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) return [];
  try {
    const res = await fetch(`${phpBase}/social-links.php`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const json = await res.json() as { data?: SocialLink[] };
    if (!Array.isArray(json.data)) return [];
    return json.data
      .map((l) => l.normalizedUrl ?? '')
      .filter((url) => url.startsWith('https://'));
  } catch {
    return [];
  }
}

export function organizationJsonLd(sameAs: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL },
    image: DEFAULT_OG_IMAGE,
    telephone: BUSINESS_PHONE,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  };
}

export function medicalBusinessJsonLd(opts: {
  telephone?: string;
  openingHours?: string | string[];
  areaServed?: string[];
  sameAs?: string[];
}) {
  const areas = opts.areaServed && opts.areaServed.length > 0 ? opts.areaServed : FALLBACK_AREAS;
  const openingHours =
    opts.openingHours && (Array.isArray(opts.openingHours) ? opts.openingHours.length > 0 : true)
      ? opts.openingHours
      : DEFAULT_OPENING_HOURS;
  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'HealthAndBeautyBusiness'],
    '@id': BUSINESS_ID,
    name: SITE_NAME,
    description:
      'Mobile IV therapy service in Bali. A certified medical team delivers hydration, recovery, and wellness drips to villas, hotels, and homes.',
    url: SITE_URL,
    telephone: opts.telephone ?? BUSINESS_PHONE,
    image: DEFAULT_OG_IMAGE,
    logo: LOGO_URL,
    priceRange: PRICE_RANGE,
    openingHours,
    currenciesAccepted: 'IDR',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Bali',
      addressCountry: 'ID',
    },
    geo: { '@type': 'GeoCoordinates', latitude: -8.4095, longitude: 115.1889 },
    areaServed: areas.map((name) => ({ '@type': 'Place', name })),
    parentOrganization: { '@id': ORG_ID },
    ...(opts.sameAs && opts.sameAs.length > 0 ? { sameAs: opts.sameAs } : {}),
  };
}

export function serviceJsonLd(opts: {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  price?: number | null;
  currency?: string | null;
  areaServed?: string[];
}) {
  const url = `${SITE_URL}/treatments/${opts.slug}`;
  const areas = opts.areaServed && opts.areaServed.length > 0 ? opts.areaServed : FALLBACK_AREAS;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Mobile IV Therapy',
    name: opts.name,
    url,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    provider: { '@id': BUSINESS_ID },
    areaServed: areas.map((name) => ({ '@type': 'Place', name })),
    ...(opts.price
      ? {
          offers: {
            '@type': 'Offer',
            price: opts.price,
            priceCurrency: opts.currency ?? 'IDR',
            url,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
