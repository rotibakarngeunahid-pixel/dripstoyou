import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

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
  title: 'DRIP TO YOU Bali — Mobile IV Therapy Delivered to You',
  description:
    'Mobile IV therapy by certified medical team — delivered to your villa, hotel, or Airbnb across Bali. Hangover recovery, immune boost, energy, beauty glow.',
  keywords: 'IV therapy Bali, mobile drip Bali, hangover recovery Bali, IV vitamin Bali',
  openGraph: {
    title: 'DRIP TO YOU Bali — Mobile IV Therapy',
    description: 'Mobile IV therapy delivered to your villa or hotel in Bali.',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
