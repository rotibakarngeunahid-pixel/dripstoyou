import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import ContactContent from '@/components/public/ContactContent';
import { getWaNumber } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Contact - Drips To You - Bali',
  description: 'Contact Drips To You - Bali for consultations, service area inquiries, and mobile IV therapy bookings in Bali.',
};

export default function ContactPage() {
  const waNumber = getWaNumber();

  return (
    <>
      <Header />
      <ContactContent waNumber={waNumber} />
      <SiteFooter />
    </>
  );
}
