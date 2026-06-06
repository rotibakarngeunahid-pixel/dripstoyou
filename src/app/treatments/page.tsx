import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/public/Header';

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

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1', name: 'Hangover Recovery', slug: 'hangover-recovery',
    short_description: 'Rehidrasi cepat dengan kombinasi elektrolit, vitamin B kompleks, dan anti-mual untuk pemulihan optimal.',
    price_amount: 750000, price_label: 'IDR 750.000', duration_minutes: 45,
    image_url: 'https://images.pexels.com/photos/3259629/pexels-photo-3259629.jpeg?auto=compress&cs=tinysrgb&w=600',
    label: 'Popular', show_on_homepage: true,
    benefits: [
      { id: '1a', benefit_text: 'Rehidrasi cepat', sort_order: 1 },
      { id: '1b', benefit_text: 'Vitamin B & C', sort_order: 2 },
      { id: '1c', benefit_text: 'Anti-mual', sort_order: 3 },
    ], faqs: [],
  },
  {
    id: '2', name: 'Immune Booster', slug: 'immune-booster',
    short_description: 'Tingkatkan sistem imun dengan vitamin C dosis tinggi, zinc, dan glutathione untuk perlindungan optimal.',
    price_amount: 650000, price_label: 'IDR 650.000', duration_minutes: 60,
    image_url: 'https://images.pexels.com/photos/4021779/pexels-photo-4021779.jpeg?auto=compress&cs=tinysrgb&w=600',
    label: 'Best Seller', show_on_homepage: true,
    benefits: [
      { id: '2a', benefit_text: 'Vitamin C dosis tinggi', sort_order: 1 },
      { id: '2b', benefit_text: 'Zinc & Glutathione', sort_order: 2 },
      { id: '2c', benefit_text: 'Peningkatan imunitas', sort_order: 3 },
    ], faqs: [],
  },
  {
    id: '3', name: 'Energy Boost', slug: 'energy-boost',
    short_description: 'Kembalikan stamina dan energimu dengan B-complex, magnesium, dan elektrolit lengkap.',
    price_amount: 550000, price_label: 'IDR 550.000', duration_minutes: 45,
    image_url: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=600',
    label: null, show_on_homepage: true,
    benefits: [
      { id: '3a', benefit_text: 'B-complex penuh', sort_order: 1 },
      { id: '3b', benefit_text: 'Magnesium', sort_order: 2 },
      { id: '3c', benefit_text: 'Elektrolit lengkap', sort_order: 3 },
    ], faqs: [],
  },
  {
    id: '4', name: 'Beauty Glow', slug: 'beauty-glow',
    short_description: 'Tampil lebih cerah dan glowing dengan glutathione, peningkat kolagen, dan antioksidan premium.',
    price_amount: 700000, price_label: 'IDR 700.000', duration_minutes: 60,
    image_url: 'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=600',
    label: 'New', show_on_homepage: true,
    benefits: [
      { id: '4a', benefit_text: 'Glutathione', sort_order: 1 },
      { id: '4b', benefit_text: 'Peningkat kolagen', sort_order: 2 },
      { id: '4c', benefit_text: 'Antioksidan premium', sort_order: 3 },
    ], faqs: [],
  },
];

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/products.php?include_benefits=1&include_faqs=1`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return FALLBACK_PRODUCTS;
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    return data.length > 0 ? data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export default async function TreatmentsPage() {
  const products = await getProducts();

  return (
    <>
      <Header />
      <main style={{ background: '#F3F0E7', minHeight: '100vh', paddingTop: 64 }}>
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)',
          padding: '72px 24px 56px', textAlign: 'center',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#25D366', display: 'inline-block' }} />
            <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#8EBFBF', fontWeight: 600 }}>Treatment Kami</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: 'white', marginBottom: 16, lineHeight: 1.1 }}>
            IV Therapy di <em style={{ fontStyle: 'italic', color: '#EAD4AE' }}>Mana Saja</em>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', maxWidth: 540, margin: '0 auto 28px', lineHeight: 1.75 }}>
            Semua treatment dirancang oleh tenaga medis profesional dan diantar langsung ke lokasi Anda di Bali.
          </p>
          <Link href="/booking" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#C9944C', color: 'white',
            padding: '14px 28px', borderRadius: 10,
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
          }}>
            Book Sekarang
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </section>

        {/* Products grid */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 28 }}>
            {products.map((product) => (
              <div key={product.id} style={{
                background: 'white', borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(32,82,81,0.08)', border: '1px solid rgba(32,82,81,0.06)',
                display: 'flex', flexDirection: 'column',
              }}>
                {product.image_url && (
                  <div style={{ height: 200, background: `url(${product.image_url}) center/cover`, position: 'relative', flexShrink: 0 }}>
                    {product.label && (
                      <span style={{
                        position: 'absolute', top: 12, left: 12,
                        background: '#C9944C', color: 'white',
                        padding: '4px 12px', borderRadius: 100,
                        fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const,
                      }}>
                        {product.label}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ padding: '24px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#205251', lineHeight: 1.2, marginBottom: 8 }}>
                    {product.name}
                  </h2>
                  <p style={{ color: '#6b7e7e', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{product.short_description}</p>

                  {product.benefits && product.benefits.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      {product.benefits.slice(0, 4).map((b) => (
                        <li key={b.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#1e2828' }}>
                          <span style={{ color: '#29808B', marginTop: 2, flexShrink: 0, fontWeight: 700 }}>✓</span>
                          {b.benefit_text}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div style={{ borderTop: '1px solid #f0eeea', paddingTop: 16, marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#205251', fontFamily: 'Playfair Display, Georgia, serif' }}>
                          {product.price_label ?? `IDR ${product.price_amount.toLocaleString('id-ID')}`}
                        </div>
                        {product.duration_minutes && (
                          <div style={{ fontSize: 12, color: '#6b7e7e' }}>± {product.duration_minutes} menit</div>
                        )}
                      </div>
                      <Link href={`/treatments/${product.slug}`} style={{
                        padding: '8px 14px', border: '1px solid #205251', borderRadius: 8,
                        fontSize: 12, fontWeight: 600, color: '#205251', textDecoration: 'none',
                      }}>
                        Detail
                      </Link>
                    </div>
                    <Link
                      href={`/booking?treatment=${product.slug}`}
                      style={{
                        display: 'block', width: '100%', textAlign: 'center',
                        background: '#205251', color: 'white',
                        padding: '12px', borderRadius: 8,
                        fontSize: 14, fontWeight: 700, textDecoration: 'none',
                        transition: 'background .2s',
                      }}
                    >
                      Book Sekarang
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Back to home */}
        <div style={{ textAlign: 'center', paddingBottom: 60 }}>
          <Link href="/" style={{ color: '#29808B', fontSize: 14, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    </>
  );
}
