import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import LegalContent, { type LegalSlug } from '@/components/public/LegalContent';
import SiteFooter from '@/components/public/SiteFooter';

const TITLES: Record<LegalSlug, string> = {
  'terms-conditions': 'Terms and Conditions',
  'privacy-policy': 'Privacy Policy',
};

function isLegalSlug(value: string): value is LegalSlug {
  return value === 'terms-conditions' || value === 'privacy-policy';
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    if (!isLegalSlug(slug)) return { title: 'Not Found' };
    return {
      title: `${TITLES[slug]} - Drips To You - Bali`,
      robots: 'noindex, follow',
    };
  });
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();

  return (
    <>
      <Header />
      <LegalContent slug={slug} />
      <SiteFooter />
    </>
  );
}
