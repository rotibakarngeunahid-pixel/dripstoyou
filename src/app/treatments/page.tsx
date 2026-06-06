import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/public/Header';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Treatments - Drips To You - Bali | Mobile IV Therapy',
  description: 'Pilihan treatment IV therapy on-call terbaik di Bali. Hangover Recovery, Immune Booster, Energy Boost, dan Beauty Glow.',
};

interface Benefit {
  id: string;
  benefit_text: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price_amount: number;
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  label: string | null;
  show_on_homepage: boolean;
  benefits: Benefit[];
  faqs: { id: string; question: string; answer: string }[];
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Hangover Recovery',
    slug: 'hangover-recovery',
    short_description: 'Rehidrasi cepat dengan kombinasi elektrolit, vitamin B kompleks, dan anti-mual untuk pemulihan optimal.',
    price_amount: 750000,
    price_label: 'IDR 750.000',
    duration_minutes: 45,
    image_url: 'https://images.pexels.com/photos/6010930/pexels-photo-6010930.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'Popular',
    show_on_homepage: true,
    benefits: [
      { id: '1a', benefit_text: 'Rehidrasi cepat', sort_order: 1 },
      { id: '1b', benefit_text: 'Vitamin B & C', sort_order: 2 },
      { id: '1c', benefit_text: 'Anti-mual', sort_order: 3 },
    ],
    faqs: [],
  },
  {
    id: '2',
    name: 'Immune Booster',
    slug: 'immune-booster',
    short_description: 'Tingkatkan sistem imun dengan vitamin C dosis tinggi, zinc, dan glutathione untuk perlindungan optimal.',
    price_amount: 650000,
    price_label: 'IDR 650.000',
    duration_minutes: 60,
    image_url: 'https://images.pexels.com/photos/6010936/pexels-photo-6010936.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'Best Seller',
    show_on_homepage: true,
    benefits: [
      { id: '2a', benefit_text: 'Vitamin C dosis tinggi', sort_order: 1 },
      { id: '2b', benefit_text: 'Zinc & Glutathione', sort_order: 2 },
      { id: '2c', benefit_text: 'Peningkatan imunitas', sort_order: 3 },
    ],
    faqs: [],
  },
  {
    id: '3',
    name: 'Energy Boost',
    slug: 'energy-boost',
    short_description: 'Kembalikan stamina dan energi dengan B-complex, magnesium, dan elektrolit lengkap.',
    price_amount: 550000,
    price_label: 'IDR 550.000',
    duration_minutes: 45,
    image_url: 'https://images.pexels.com/photos/11081177/pexels-photo-11081177.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: null,
    show_on_homepage: true,
    benefits: [
      { id: '3a', benefit_text: 'B-complex penuh', sort_order: 1 },
      { id: '3b', benefit_text: 'Magnesium', sort_order: 2 },
      { id: '3c', benefit_text: 'Elektrolit lengkap', sort_order: 3 },
    ],
    faqs: [],
  },
  {
    id: '4',
    name: 'Beauty Glow',
    slug: 'beauty-glow',
    short_description: 'Tampil lebih cerah dengan glutathione, peningkat kolagen, dan antioksidan premium.',
    price_amount: 700000,
    price_label: 'IDR 700.000',
    duration_minutes: 60,
    image_url: 'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=900',
    label: 'New',
    show_on_homepage: true,
    benefits: [
      { id: '4a', benefit_text: 'Glutathione', sort_order: 1 },
      { id: '4b', benefit_text: 'Peningkat kolagen', sort_order: 2 },
      { id: '4c', benefit_text: 'Antioksidan premium', sort_order: 3 },
    ],
    faqs: [],
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

function formatPrice(product: Product) {
  return product.price_label ?? `IDR ${product.price_amount.toLocaleString('id-ID')}`;
}

export default async function TreatmentsPage() {
  const products = await getProducts();

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero centered">
          <div className="page-hero-inner">
            <div className="page-eyebrow">Treatment Kami</div>
            <h1 className="page-title">
              IV Therapy di <em>Mana Saja</em>
            </h1>
            <p className="page-subtitle">
              Semua treatment dirancang oleh tenaga medis profesional dan diantar langsung ke lokasi Anda di Bali.
            </p>
            <div className="page-actions" style={{ justifyContent: 'center' }}>
              <Link href="/booking" className="button button-gold">
                Book Sekarang
              </Link>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-media">
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={`${product.name} IV therapy`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                      className="card-photo"
                    />
                  )}
                  {product.label && (
                    <span
                      className="status-pill"
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        background: 'rgba(255,255,255,.94)',
                        color: 'var(--gold)',
                      }}
                    >
                      {product.label}
                    </span>
                  )}
                </div>

                <div className="product-body">
                  <h2 className="product-title">{product.name}</h2>
                  <p className="product-desc">{product.short_description}</p>

                  {product.benefits && product.benefits.length > 0 && (
                    <ul className="product-benefits">
                      {product.benefits.slice(0, 4).map((benefit) => (
                        <li key={benefit.id}>{benefit.benefit_text}</li>
                      ))}
                    </ul>
                  )}

                  <div className="product-footer">
                    <div className="price-row">
                      <div>
                        <div className="price-text">{formatPrice(product)}</div>
                        {product.duration_minutes && (
                          <div className="muted-small">sekitar {product.duration_minutes} menit</div>
                        )}
                      </div>
                      <Link href={`/treatments/${product.slug}`} className="button button-secondary">
                        Detail
                      </Link>
                    </div>
                    <Link href={`/booking?treatment=${product.slug}`} className="button button-primary full">
                      Book Sekarang
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 42 }}>
            <Link href="/" className="icon-link">
              Kembali ke Beranda
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
