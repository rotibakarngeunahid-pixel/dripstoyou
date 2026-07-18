import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo';

const PAGE_URL = `${SITE_URL}/booking`;
const DESCRIPTION = 'Book your mobile IV therapy session in Bali in 3 easy steps. Choose a treatment, pick a schedule, and our certified medical team comes to your location.';

export const metadata: Metadata = {
  title: 'Book Mobile IV Therapy in Bali',
  description: DESCRIPTION,
  openGraph: {
    title: 'Book Mobile IV Therapy in Bali | Drips To You - Bali',
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book Mobile IV Therapy in Bali | Drips To You - Bali',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: { canonical: PAGE_URL },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: 'Booking', url: PAGE_URL },
        ])}
      />
      {children}
    </>
  );
}
