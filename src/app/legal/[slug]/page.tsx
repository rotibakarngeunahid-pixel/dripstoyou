import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import LegalContent, { type LegalSlug } from '@/components/public/LegalContent';
import SiteFooter from '@/components/public/SiteFooter';

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

  const siteEmail = await getSiteEmail();

  return (
    <>
      <Header />
      <LegalContent slug={slug} siteEmail={siteEmail} />
      <SiteFooter />
    </>
  );
}
