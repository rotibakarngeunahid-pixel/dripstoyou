import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import FaqContent from '@/components/public/FaqContent';
import { getWaNumber } from '@/lib/whatsapp';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'FAQ | Drips To You - Bali Mobile IV Therapy',
  description: 'Frequently asked questions about Drips To You - Bali: how IV therapy works, booking process, safety, pricing, and which areas we serve.',
  openGraph: {
    title: 'FAQ - Drips To You - Bali',
    description: 'Answers to common questions about mobile IV therapy in Bali — booking, safety, pricing, and service areas.',
    url: 'https://dripstoyou.com/faq',
  },
  alternates: { canonical: 'https://dripstoyou.com/faq' },
};

interface Faq {
  id: string;
  questionEn: string;
  answerEn: string;
  questionId: string;
  answerId: string;
}

async function getFaqs(): Promise<Faq[]> {
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) return [];
  try {
    const res = await fetch(`${phpBase}/faqs.php`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function FaqPage() {
  const [faqs, waNumber] = await Promise.all([
    getFaqs(),
    Promise.resolve(getWaNumber()),
  ]);

  return (
    <>
      <Header />
      <FaqContent faqs={faqs} waNumber={waNumber} />
      <SiteFooter />
    </>
  );
}
