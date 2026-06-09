import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/language';
import TopProgressBar from '@/components/TopProgressBar';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const SITE_URL = 'https://dripstoyou.com';
const OG_IMAGE = 'https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image/drips-to-you-bali-og.webp';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Drips To You - Bali | Mobile IV Therapy Delivered to You',
    template: '%s | Drips To You - Bali',
  },
  description:
    'Mobile IV therapy by a certified medical team, delivered to eligible villas, hotels, homes, and accommodations in Bali. Book online in minutes.',
  keywords: 'IV therapy Bali, mobile drip Bali, hangover recovery Bali, IV vitamin Bali, drip therapy Bali, IV infusion Bali, wellness Bali',
  authors: [{ name: 'Drips To You - Bali' }],
  creator: 'Drips To You - Bali',
  publisher: 'Drips To You - Bali',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: {
    icon: 'https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image/drips-to-you-bali-icon.webp',
    apple: 'https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image/drips-to-you-bali-icon.webp',
  },
  openGraph: {
    title: 'Drips To You - Bali | Mobile IV Therapy',
    description: 'Mobile IV therapy delivered to eligible villas, hotels, homes, and accommodations in Bali. Certified medical team. Book in minutes.',
    url: SITE_URL,
    siteName: 'Drips To You - Bali',
    locale: 'en_US',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drips To You - Bali | Mobile IV Therapy',
    description: 'Mobile IV therapy delivered to your villa, hotel or home in Bali. Certified team. Book online.',
    images: [OG_IMAGE],
  },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>
        <TopProgressBar />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
