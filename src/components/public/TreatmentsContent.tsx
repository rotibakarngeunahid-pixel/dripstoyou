'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';
import { formatPrice as formatCurrencyPrice } from '@/lib/currency';

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
  currency: string | null;
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

function parsePriceDisplay(product: Product): { primary: string; secondary: string | null } {
  const raw = product.price_label ?? formatCurrencyPrice(product.price_amount, product.currency);
  if (raw.includes('/')) {
    const parts = raw.split('/').map((s) => s.trim());
    return { primary: parts[0], secondary: parts.slice(1).join(' / ') };
  }
  return { primary: raw, secondary: null };
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
        {products.length === 0 ? (
          <div className="empty-state surface-card">
            {t.treatmentsPage.emptyState}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => {
              const { primary, secondary } = parsePriceDisplay(product);
              return (
                <article className="product-card" key={product.id}>
                  <div className="product-media">
                    {product.image_url && (
                      <Image
                        src={product.image_url}
                        alt={`${product.name} IV therapy`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                        className="card-photo"
                        unoptimized
                      />
                    )}
                    <div className="product-media-overlay" />
                    {product.label && (
                      <span className="product-label-pill">{product.label}</span>
                    )}
                  </div>

                  <div className="product-body">
                    <h2 className="product-title">{product.name}</h2>
                    {product.short_description && (
                      <p className="product-desc">{product.short_description}</p>
                    )}

                    {product.benefits && product.benefits.length > 0 && (
                      <div className="product-chips">
                        {product.benefits.slice(0, 4).map((benefit) => (
                          <span key={benefit.id} className="benefit-chip">
                            {benefit.benefit_text}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="product-footer">
                      <div className="product-price-block">
                        <div className="product-price-primary">{primary}</div>
                        {secondary && (
                          <div className="product-price-secondary">{secondary}</div>
                        )}
                        {product.duration_minutes && (
                          <div className="product-duration">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {t.treatmentsPage.durationText.replace('{n}', String(product.duration_minutes))}
                          </div>
                        )}
                      </div>

                      <div className="product-actions">
                        <Link
                          href={`/treatments/${product.slug}`}
                          className="button button-secondary product-btn-detail"
                        >
                          {t.treatmentsPage.detail}
                        </Link>
                        <Link
                          href={`/booking?treatment=${product.slug}`}
                          className="button button-primary product-btn-book"
                        >
                          {t.treatmentsPage.bookNow}
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 42 }}>
          <Link href="/" className="icon-link">
            {t.treatmentsPage.backHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
