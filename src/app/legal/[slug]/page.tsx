import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getLegalPage(slug: string) {
  try {
    const page = await prisma.legalPage.findFirst({ where: { slug, isPublished: true } });
    if (page) return { title: page.title, content: page.content, updatedAt: page.updatedAt.toISOString() };
  } catch {
    // DB not available — fall through to PHP
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/legal.php?slug=${encodeURIComponent(slug)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.data;
    if (!d) return null;
    return { title: d.title as string, content: d.content as string, updatedAt: d.updated_at as string };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) return { title: 'Not Found' };
  return { title: `${page.title} - Drips To You - Bali`, robots: 'noindex' };
}

export default async function LegalPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) notFound();

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero centered">
          <div className="page-hero-inner">
            <h1 className="page-title">{page.title}</h1>
            <p className="page-subtitle">
              Terakhir diperbarui: {new Date(page.updatedAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </section>

        <section className="page-section narrow">
          <article className="content-card">
            <p style={{ whiteSpace: 'pre-wrap' }}>{page.content}</p>
          </article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
