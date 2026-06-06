import Header from '@/components/public/Header';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import HomeContent from '@/components/public/HomeContent';
import type { HomepageProduct } from '@/components/public/HomeContent';

export const dynamic = 'force-dynamic';

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

async function getHomepageProducts(): Promise<HomepageProduct[]> {
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) return [];
  try {
    const res = await fetch(`${phpBase}/products.php`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const all: HomepageProduct[] = Array.isArray(json.data) ? json.data : [];
    return all
      .filter((p) => p.show_on_homepage)
      .sort((a, b) => (a.homepage_order ?? 99) - (b.homepage_order ?? 99));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [settings, homepageProducts] = await Promise.all([
    getPublicSettings(),
    getHomepageProducts(),
  ]);

  const waNumber =
    (settings?.whatsappNumber as string | undefined) ??
    process.env.WHATSAPP_NUMBER ??
    '6281200000000';

  return (
    <>
      <Header />
      <ScrollRevealInit />
      <HomeContent waNumber={waNumber} homepageProducts={homepageProducts} />
    </>
  );
}
