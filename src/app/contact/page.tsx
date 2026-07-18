import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import ContactContent from '@/components/public/ContactContent';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo';

const PAGE_URL = `${SITE_URL}/contact`;
const DESCRIPTION = 'Contact Drips To You - Bali on WhatsApp for IV therapy consultations, service area checks, and bookings across Bali. Fast response, 08:00–22:00 WITA.';

export const metadata: Metadata = {
  title: 'Contact Us — Mobile IV Therapy Bali',
  description: DESCRIPTION,
  openGraph: {
    title: 'Contact Us | Drips To You - Bali',
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Drips To You - Bali',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: { canonical: PAGE_URL },
};

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

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const waNumber =
    (settings?.whatsappNumber as string | undefined) ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    '6281200000000';

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: 'Contact Us', url: PAGE_URL },
        ])}
      />
      <Header />
      <ContactContent waNumber={waNumber} />
      <SiteFooter waNumber={waNumber} />
    </>
  );
}
