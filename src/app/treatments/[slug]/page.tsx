import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { waBookingUrl } from '@/lib/whatsapp';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Benefit { id: string; benefit_text: string }
interface Faq { id: string; question: string; answer: string }
interface Product {
  id: string; name: string; slug: string;
  short_description: string | null; full_description: string | null;
  price_amount: number; price_label: string | null;
  duration_minutes: number | null; image_url: string | null; label: string | null;
  benefits: Benefit[]; faqs: Faq[];
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/products.php?slug=${encodeURIComponent(slug)}&include_benefits=1&include_faqs=1`,
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
  const product  = await getProduct(slug);
  if (!product) return { title: 'Not Found' };
  return {
    title:       `${product.name} — Drips To You - Bali`,
    description: product.short_description ?? undefined,
  };
}

export default async function TreatmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product  = await getProduct(slug);
  if (!product) notFound();

  return (
    <main style={{ background: '#F3F0E7', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)', padding: '80px 24px 64px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link href="/treatments" style={{ color: '#8EBFBF', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Semua Treatment
          </Link>
          {product.label && (
            <div style={{ display: 'inline-block', background: '#C9944C', color: 'white', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              {product.label}
            </div>
          )}
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: 'white', marginBottom: 16 }}>
            {product.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 16, lineHeight: 1.7, maxWidth: 600, marginBottom: 32 }}>
            {product.short_description}
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#C9944C' }}>
              {product.price_label ?? `IDR ${product.price_amount.toLocaleString('id-ID')}`}
            </span>
            {product.duration_minutes && (
              <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 14 }}>± {product.duration_minutes} menit</span>
            )}
            <a
              href={waBookingUrl(product.name, product.price_label ?? undefined)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '12px 28px', background: '#25D366', color: 'white', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Pesan Sekarang via WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: product.full_description ? '1fr 1fr' : '1fr', gap: 32, marginBottom: 48 }}>
          {product.benefits && product.benefits.length > 0 && (
            <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(32,82,81,0.08)' }}>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#205251', marginBottom: 20 }}>Kandungan & Manfaat</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {product.benefits.map((b) => (
                  <li key={b.id} style={{ display: 'flex', gap: 12, fontSize: 14, color: '#1e2828', lineHeight: 1.5 }}>
                    <span style={{ width: 20, height: 20, background: '#29808B', color: 'white', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {b.benefit_text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.full_description && (
            <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(32,82,81,0.08)' }}>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#205251', marginBottom: 16 }}>Tentang Treatment Ini</h2>
              <div style={{ color: '#4a5e5e', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{product.full_description}</div>
            </div>
          )}
        </div>

        {product.faqs && product.faqs.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(32,82,81,0.08)', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#205251', marginBottom: 24 }}>FAQ</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {product.faqs.map((faq) => (
                <div key={faq.id} style={{ borderBottom: '1px solid #f0eeea', paddingBottom: 20 }}>
                  <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 15, fontWeight: 600, color: '#205251', marginBottom: 8 }}>{faq.question}</h3>
                  <p style={{ color: '#6b7e7e', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)', borderRadius: 24, padding: '40px 32px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 12 }}>
            Siap mencoba {product.name}?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, marginBottom: 24 }}>
            Tim medis kami siap hadir ke lokasi Anda dalam 30-60 menit.
          </p>
          <a
            href={waBookingUrl(product.name, product.price_label ?? undefined)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 32px', background: '#25D366', color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Pesan {product.name}
          </a>
        </div>
      </section>
    </main>
  );
}
