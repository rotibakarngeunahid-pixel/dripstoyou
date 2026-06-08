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

export const metadata: Metadata = {
  title: 'Drips To You - Bali | Mobile IV Therapy Delivered to You',
  description:
    'Mobile IV therapy by a certified medical team, delivered to eligible villas, hotels, homes, and accommodations in Bali.',
  keywords: 'IV therapy Bali, mobile drip Bali, hangover recovery Bali, IV vitamin Bali, drip therapy Bali',
  icons: {
    icon: 'https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image/drips-to-you-bali-icon.webp',
    apple: 'https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image/drips-to-you-bali-icon.webp',
  },
  openGraph: {
    title: 'Drips To You - Bali | Mobile IV Therapy',
    description: 'Mobile IV therapy delivered to eligible villas, hotels, homes, and accommodations in Bali.',
    locale: 'en_US',
    type: 'website',
  },
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
