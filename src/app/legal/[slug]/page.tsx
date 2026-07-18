import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import LegalContent, { type LegalSlug } from '@/components/public/LegalContent';
import SiteFooter from '@/components/public/SiteFooter';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, SITE_URL } from '@/lib/seo';

export const revalidate = 60;

async function getSiteEmail(): Promise<string> {
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) return 'hello@dripstoyou.com';
  try {
    const res = await fetch(`${phpBase}/settings.php`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return 'hello@dripstoyou.com';
    const json = await res.json();
    return (json.data?.siteEmail as string) || 'hello@dripstoyou.com';
  } catch {
    return 'hello@dripstoyou.com';
  }
}

const TITLES: Record<LegalSlug, string> = {
  'terms-conditions': 'Terms and Conditions',
  'privacy-policy': 'Privacy Policy',
};

const DESCRIPTIONS: Record<LegalSlug, string> = {
  'terms-conditions':
    'Terms and conditions for Drips To You - Bali mobile IV therapy services: bookings, cancellations, eligibility, and service coverage across Bali.',
  'privacy-policy':
    'How Drips To You - Bali collects, uses, and protects your personal data when you book mobile IV therapy or contact us via the website and WhatsApp.',
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
      title: TITLES[slug],
      description: DESCRIPTIONS[slug],
      alternates: { canonical: `${SITE_URL}/legal/${slug}` },
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

  const siteEmail = await getSiteEmail();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: TITLES[slug], url: `${SITE_URL}/legal/${slug}` },
        ])}
      />
      <Header />
      <LegalContent slug={slug} siteEmail={siteEmail} />
      <SiteFooter />
    </>
  );
}
