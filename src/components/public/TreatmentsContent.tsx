'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';

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
}

interface Props {
  products: Product[];
}

function formatPrice(product: Product) {
  return product.price_label ?? `IDR ${product.price_amount.toLocaleString('id-ID')}`;
}

export default function TreatmentsContent({ products }: Props) {
  const { t } = useLanguage();

  return (
    <main className="page-shell">
      <section className="page-hero centered">
        <div className="page-hero-inner">
          <div className="page-eyebrow">{t.treatmentsPage.eyebrow}</div>
          <h1 className="page-title">
            {t.treatmentsPage.title} <em>{t.treatmentsPage.titleEm}</em>
          </h1>
          <p className="page-subtitle">{t.treatmentsPage.subtitle}</p>
          <div className="page-actions" style={{ justifyContent: 'center' }}>
            <Link href="/booking" className="button button-gold">
              {t.treatmentsPage.bookNow}
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
                    style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,.94)', color: 'var(--gold)' }}
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
                        <div className="muted-small">
                          {t.treatmentsPage.durationText.replace('{n}', String(product.duration_minutes))}
                        </div>
                      )}
                    </div>
                    <Link href={`/treatments/${product.slug}`} className="button button-secondary">
                      {t.treatmentsPage.detail}
                    </Link>
                  </div>
                  <Link href={`/booking?treatment=${product.slug}`} className="button button-primary full">
                    {t.treatmentsPage.bookNow}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 42 }}>
          <Link href="/" className="icon-link">
            {t.treatmentsPage.backHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
