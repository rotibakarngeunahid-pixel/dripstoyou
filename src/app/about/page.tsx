import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import AboutContent from '@/components/public/AboutContent';
import { getWaNumber } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'About Us - Drips To You - Bali | Mobile IV Therapy',
  description: 'Drips To You - Bali is a professional on-call IV therapy service delivered directly to your villa, hotel, or accommodation across Bali.',
};

export default function AboutPage() {
  const waNumber = getWaNumber();

  return (
    <>
      <Header />
      <AboutContent waNumber={waNumber} />
      <SiteFooter />
    </>
  );
}
