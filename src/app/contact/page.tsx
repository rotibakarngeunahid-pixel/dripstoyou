import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import ContactContent from '@/components/public/ContactContent';
import { getWaNumber } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Contact Us | Drips To You - Bali Mobile IV Therapy',
  description: 'Get in touch with Drips To You - Bali for questions, consultations, service area inquiries, and IV therapy bookings.',
  openGraph: {
    title: 'Contact Drips To You - Bali',
    description: 'Questions about mobile IV therapy in Bali? Contact us via WhatsApp or the form below.',
    url: 'https://dripstoyou.com/contact',
  },
  alternates: { canonical: 'https://dripstoyou.com/contact' },
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
