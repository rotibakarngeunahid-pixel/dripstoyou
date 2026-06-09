import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import ContactContent from '@/components/public/ContactContent';

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

async function getPublicSettings(): Promise<{ whatsappNumber?: string } | null> {
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) return null;
  try {
    const res = await fetch(`${phpBase}/settings.php`, {
      cache: 'no-store',
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
      <Header />
      <ContactContent waNumber={waNumber} />
      <SiteFooter waNumber={waNumber} />
    </>
  );
}
