import type { Metadata } from 'next';
import { waBookingUrl } from '@/lib/whatsapp';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Treatments — DRIP TO YOU Bali | Mobile IV Therapy',
  description: 'Pilihan treatment IV therapy on-call terbaik di Bali. Hangover Recovery, Immune Booster, Energy Boost, dan Beauty Glow.',
};

interface Benefit { id: string; benefit_text: string; sort_order: number }
interface Product {
  id: string; name: string; slug: string;
  short_description: string | null; price_amount: number; price_label: string | null;
  duration_minutes: number | null; image_url: string | null; label: string | null;
  show_on_homepage: boolean; benefits: Benefit[];
  faqs: { id: string; question: string; answer: string }[];
}

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/products.php?include_benefits=1&include_faqs=1`,
      { cache: 'no-store' },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function TreatmentsPage() {
  const products = await getProducts();

  return (
    <main style={{ background: '#F3F0E7', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)', padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: '#8EBFBF', marginBottom: 16 }}>Our Treatments</p>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: 'white', marginBottom: 16 }}>
          IV Therapy di <em>Mana Saja</em>
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: 'rgba(255,255,255,.7)', maxWidth: 540, margin: '0 auto' }}>
          Semua treatment dirancang oleh tenaga medis profesional dan diantar langsung ke lokasi Anda di Bali.
        </p>
      </section>

      {/* Products */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        {products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6b7e7e', fontSize: 16 }}>
            Treatment belum tersedia. Silakan hubungi kami via WhatsApp.
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
          {products.map((product) => (
            <div key={product.id} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(32,82,81,0.08)', border: '1px solid rgba(32,82,81,0.08)' }}>
              {product.image_url && (
                <div style={{ height: 200, background: `url(${product.image_url}) center/cover`, position: 'relative' }}>
                  {product.label && (
                    <span style={{ position: 'absolute', top: 12, left: 12, background: '#C9944C', color: 'white', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                      {product.label}
                    </span>
                  )}
                </div>
              )}
              <div style={{ padding: '24px 24px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#205251', lineHeight: 1.2 }}>
                    {product.name}
                  </h2>
                </div>
                <p style={{ color: '#6b7e7e', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{product.short_description}</p>

                {product.benefits && product.benefits.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {product.benefits.map((b) => (
                      <li key={b.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#1e2828' }}>
                        <span style={{ color: '#29808B', marginTop: 2, flexShrink: 0 }}>✓</span>
                        {b.benefit_text}
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ borderTop: '1px solid #f0eeea', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#205251', fontFamily: 'Playfair Display, Georgia, serif' }}>
                      {product.price_label ?? `IDR ${product.price_amount.toLocaleString('id-ID')}`}
                    </div>
                    {product.duration_minutes && (
                      <div style={{ fontSize: 12, color: '#6b7e7e' }}>± {product.duration_minutes} menit</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/treatments/${product.slug}`} style={{ padding: '8px 14px', border: '1px solid #205251', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#205251', textDecoration: 'none' }}>
                      Detail
                    </Link>
                    <a
                      href={waBookingUrl(product.name, product.price_label ?? undefined)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '8px 16px', background: '#25D366', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Book
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
