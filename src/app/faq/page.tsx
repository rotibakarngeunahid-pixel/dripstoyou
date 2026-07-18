import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import FaqContent from '@/components/public/FaqContent';
import { getWaNumber } from '@/lib/whatsapp';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, faqPageJsonLd, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo';

export const revalidate = 120;

const PAGE_URL = `${SITE_URL}/faq`;
const DESCRIPTION = 'Answers about mobile IV therapy in Bali: how booking works, treatment safety, pricing, and the areas we serve. Read the FAQ, then book in minutes.';

export const metadata: Metadata = {
  title: 'FAQ — Mobile IV Therapy Bali',
  description: DESCRIPTION,
  openGraph: {
    title: 'FAQ | Drips To You - Bali',
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Drips To You - Bali',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: { canonical: PAGE_URL },
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

  const schemaFaqs = faqs
    .filter((f) => f.questionEn && f.answerEn)
    .map((f) => ({ question: f.questionEn, answer: f.answerEn }));

  return (
    <>
      {schemaFaqs.length > 0 && <JsonLd data={faqPageJsonLd(schemaFaqs)} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: 'FAQ', url: PAGE_URL },
        ])}
      />
      <Header />
      <FaqContent faqs={faqs} waNumber={waNumber} />
      <SiteFooter />
    </>
  );
}
