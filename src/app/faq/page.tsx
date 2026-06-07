import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import FaqContent from '@/components/public/FaqContent';
import { getWaNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FAQ - Drips To You - Bali | Frequently Asked Questions',
  description: 'Answers to common questions about Drips To You - Bali IV therapy on-call service, booking process, safety, and service areas.',
};

interface Faq {
  id: string;
  questionEn: string;
  answerEn: string;
  questionId: string;
  answerId: string;
}

async function getFaqs(): Promise<Faq[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/public/faqs`, {
      cache: 'no-store',
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
