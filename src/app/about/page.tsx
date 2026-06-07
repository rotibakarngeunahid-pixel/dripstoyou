import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import AboutContent, { type LocalizedAboutContent } from '@/components/public/AboutContent';
import { getWaNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Us - Drips To You - Bali | Mobile IV Therapy',
  description: 'Learn about Drips To You - Bali and the active service areas configured by our team.',
};

type Area = { id: string; name: string };

async function getAboutData(): Promise<LocalizedAboutContent | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/about.php`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function getAreas(): Promise<Area[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return [];
  try {
    const res = await fetch(`${base}/areas.php`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data)
      ? json.data.map((area: Area) => ({ id: area.id, name: area.name }))
      : [];
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const [content, areas] = await Promise.all([getAboutData(), getAreas()]);
  const waNumber = getWaNumber();

  return (
    <>
      <Header />
      <AboutContent waNumber={waNumber} content={content} areas={areas} />
      <SiteFooter />
    </>
  );
}
