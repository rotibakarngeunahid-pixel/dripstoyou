'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';
import { formatPrice as formatCurrencyPrice, normalizeCurrency } from '@/lib/currency';

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
  prices?: Record<string, number>;
}

interface Props {
  products: Product[];
}

const SUPPORTED_CURRENCIES = ['IDR', 'USD', 'AUD', 'EUR'] as const;

const DROP_SVG = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);

const CLOCK_SVG = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ARROW_SVG = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

function getAvailableCurrencies(product: Product): string[] {
  if (product.prices && Object.keys(product.prices).length > 0) {
    return SUPPORTED_CURRENCIES.filter(c => product.prices![c] !== undefined);
  }
  return [normalizeCurrency(product.currency)];
}

function getPrimaryPrice(product: Product, currency: string): string {
  if (product.prices?.[currency] !== undefined) {
    return formatCurrencyPrice(product.prices[currency], currency);
  }
  return product.price_label ?? formatCurrencyPrice(product.price_amount, product.currency);
}

function getSecondaryPrices(product: Product, selectedCurrency: string): string {
  if (!product.prices) return '';
  return SUPPORTED_CURRENCIES
    .filter(c => c !== selectedCurrency && product.prices![c] !== undefined)
    .map(c => formatCurrencyPrice(product.prices![c], c))
    .join(' · ');
}

export default function TreatmentsContent({ products }: Props) {
  const { t, lang } = useLanguage();
  const [cardCurrencies, setCardCurrencies] = useState<Record<string, string>>({});

  function getCardCurrency(product: Product): string {
    const available = getAvailableCurrencies(product);
    const saved = cardCurrencies[product.id];
    if (saved && available.includes(saved)) return saved;
    return available[0] ?? normalizeCurrency(product.currency);
  }

  function setCardCurrency(productId: string, currency: string) {
    setCardCurrencies(prev => ({ ...prev, [productId]: currency }));
  }

  const isEn = lang === 'en';

  return (
    <main className="page-shell">
      {/* Page hero */}
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
          <>
            {/* Currency header */}
            <div className="tp-header-row">
              <div>
                <p className="tp-header-title">
                  {isEn ? 'Choose currency per treatment' : 'Pilih mata uang per treatment'}
                </p>
                <p className="tp-header-sub">
                  {isEn
                    ? 'Each treatment supports multiple currencies. Select your preferred currency on each card.'
                    : 'Setiap treatment mendukung beberapa mata uang. Pilih mata uang pilihan Anda di setiap kartu.'}
                </p>
              </div>
              <div className="tp-auto-note">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{isEn ? 'Prices update automatically.' : 'Harga diperbarui otomatis.'}</span>
              </div>
            </div>

            {/* Treatment grid */}
            <div className="tp-grid">
              {products.map((product) => {
                const available = getAvailableCurrencies(product);
                const selectedCurrency = getCardCurrency(product);
                const primaryPrice = getPrimaryPrice(product, selectedCurrency);
                const secondaryPrices = getSecondaryPrices(product, selectedCurrency);
                const hasMultiCurrency = available.length > 1;

                return (
                  <article className="tp-card" key={product.id}>
                    {/* Image */}
                    <div className="tp-card-media">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={`${product.name} IV therapy`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                          className="tp-card-photo"
                          unoptimized
                        />
                      ) : (
                        <div className="tp-card-placeholder" />
                      )}
                      <div className="tp-card-overlay" />
                      {product.label && (
                        <span className="tp-card-badge">{product.label}</span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="tp-card-body">
                      {/* Name row */}
                      <div className="tp-name-row">
                        <span className="tp-drop-icon">{DROP_SVG}</span>
                        <h2 className="tp-name">{product.name}</h2>
                      </div>

                      {/* Description */}
                      {product.short_description && (
                        <p className="tp-desc">{product.short_description}</p>
                      )}

                      {/* Duration */}
                      {product.duration_minutes && (
                        <div className="tp-duration">
                          {CLOCK_SVG}
                          <span>
                            {t.treatmentsPage.durationText.replace('{n}', String(product.duration_minutes))}
                          </span>
                        </div>
                      )}

                      {/* Currency selector */}
                      {hasMultiCurrency && (
                        <div className="tp-currency-row">
                          <span className="tp-currency-label">
                            {isEn ? 'Currency' : 'Mata Uang'}
                          </span>
                          <div className="tp-currency-tabs">
                            {available.map(code => (
                              <button
                                key={code}
                                className={`tp-currency-tab${selectedCurrency === code ? ' active' : ''}`}
                                onClick={() => setCardCurrency(product.id, code)}
                                type="button"
                                aria-pressed={selectedCurrency === code}
                              >
                                {code}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price */}
                      <div className="tp-price-primary">{primaryPrice}</div>
                      {secondaryPrices && (
                        <div className="tp-price-secondary">{secondaryPrices}</div>
                      )}

                      {/* Actions */}
                      <div className="tp-actions">
                        <Link
                          href={`/treatments/${product.slug}`}
                          className="tp-btn-detail"
                        >
                          {t.treatmentsPage.detail}
                        </Link>
                        <Link
                          href={`/booking?treatment=${product.slug}`}
                          className="tp-btn-book"
                        >
                          {t.treatmentsPage.bookNow}
                          {ARROW_SVG}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="tp-footer-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>
                {isEn
                  ? 'Taxes may vary by location. Local pricing in Indonesian Rupiah.'
                  : 'Pajak dapat bervariasi berdasarkan lokasi. Harga lokal dalam Rupiah Indonesia.'}
              </span>
            </div>

            {/* Info boxes */}
            <div className="tp-info-boxes">
              <div className="tp-info-box">
                <div className="tp-info-box-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div>
                  <div className="tp-info-box-title">
                    {isEn ? 'Local pricing in Indonesian Rupiah' : 'Harga lokal dalam Rupiah Indonesia'}
                  </div>
                  <div className="tp-info-box-desc">
                    {isEn ? 'Best value for residents and locals.' : 'Nilai terbaik untuk warga dan penduduk lokal.'}
                  </div>
                </div>
              </div>
              <div className="tp-info-box">
                <div className="tp-info-box-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                  </svg>
                </div>
                <div>
                  <div className="tp-info-box-title">
                    {isEn ? 'International guest-friendly pricing' : 'Harga ramah tamu internasional'}
                  </div>
                  <div className="tp-info-box-desc">
                    {isEn ? 'Transparent, auto-converted for travelers.' : 'Transparan, dikonversi otomatis untuk wisatawan.'}
                  </div>
                </div>
              </div>
            </div>
          </>
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
