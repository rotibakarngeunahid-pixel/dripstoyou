import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface LegalPageData {
  id: string; type: string; title: string; slug: string;
  content: string; is_published: boolean; updated_at: string;
}

async function getLegalPage(slug: string): Promise<LegalPageData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/legal.php?slug=${encodeURIComponent(slug)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page     = await getLegalPage(slug);
  if (!page) return { title: 'Not Found' };
  return { title: `${page.title} — DRIP TO YOU Bali`, robots: 'noindex' };
}

export default async function LegalPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page     = await getLegalPage(slug);
  if (!page) notFound();

  return (
    <main style={{ background: '#F3F0E7', minHeight: '100vh' }}>
      <section style={{ background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)', padding: '64px 24px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 700, color: 'white' }}>
          {page.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, marginTop: 12 }}>
          Terakhir diperbarui: {new Date(page.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </section>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '40px 36px', boxShadow: '0 4px 24px rgba(32,82,81,0.08)', color: '#4a5e5e', fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
          {page.content}
        </div>
      </section>
    </main>
  );
}
