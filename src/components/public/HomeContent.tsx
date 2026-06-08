'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';
import { formatPrice as formatCurrencyPrice, CURRENCY_OPTIONS, normalizeCurrency } from '@/lib/currency';

export interface HomepageProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price_amount: number;
  currency: string | null;
  price_label: string | null;
  image_url: string | null;
  label: string | null;
  show_on_homepage: boolean;
  homepage_order: number;
  duration_minutes?: number | null;
  prices?: Record<string, number>;
}

export interface ServiceAreaData {
  id: string;
  name: string;
  isActive: boolean;
  estimatedArrivalMinutes: number | null;
  note: string | null;
  sortOrder: number;
}

interface Props {
  waNumber: string;
  homepageProducts?: HomepageProduct[];
  serviceAreas?: ServiceAreaData[];
}

const IK = 'https://ik.imagekit.io/raocx4xwl/Drips%20To%20You%20-%20Image';
const BRAND = {
  logo:         `${IK}/drips-to-you-bali-icon.webp`,
  photo1:       '/img/home-section-dripstoyou.webp',
  photo1Mobile: '/img/hero-section-mobile.webp',
  photoWhy:     '/img/widescreen-dripstoyoubali.webp',
  photo2:       `${IK}/photo_6134052561527443396_y.webp`,
  photo3:       `${IK}/photo_6131724036417982600_y.webp`,
  photo4:       `${IK}/photo_6134052561527443397_y.webp`,
  photo5:       `${IK}/photo_6134052561527443395_y.webp`,
};

const WA_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const ARROW_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const BOLT_SVG = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const CLOCK_SVG = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const DROP_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);

function arrivalLabel(minutes: number | null, lang: 'en' | 'id'): string {
  if (!minutes) return lang === 'en' ? 'Confirm with our team' : 'Konfirmasi dengan tim';
  const lo = Math.max(10, minutes - 10);
  const hi = minutes + 10;
  return `${lo}–${hi} min`;
}

const SUPPORTED_CURRENCIES = ['IDR', 'USD', 'AUD', 'EUR'] as const;

function getAvailableCurrencies(product: HomepageProduct): string[] {
  if (product.prices && Object.keys(product.prices).length > 0) {
    return SUPPORTED_CURRENCIES.filter(c => product.prices![c] !== undefined);
  }
  return [normalizeCurrency(product.currency)];
}

function getPrimaryPrice(product: HomepageProduct, currency: string): string {
  if (product.prices?.[currency] !== undefined) {
    return formatCurrencyPrice(product.prices[currency], currency);
  }
  return product.price_label ?? formatCurrencyPrice(product.price_amount, product.currency);
}

function getSecondaryPrices(product: HomepageProduct, selectedCurrency: string): string {
  if (!product.prices) return '';
  return SUPPORTED_CURRENCIES
    .filter(c => c !== selectedCurrency && product.prices![c] !== undefined)
    .map(c => formatCurrencyPrice(product.prices![c], c))
    .join(' · ');
}

export default function HomeContent({ waNumber, homepageProducts, serviceAreas }: Props) {
  const { lang, t } = useLanguage();

  function waUrl(text: string) {
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  }

  const waBookingMsg = lang === 'en'
    ? 'Hello Drips To You - Bali, I would like to book an IV therapy treatment'
    : 'Halo Drips To You - Bali, saya ingin memesan treatment IV therapy';

  const displayProducts = homepageProducts ?? [];
  const displayAreas    = serviceAreas && serviceAreas.length > 0
    ? serviceAreas.filter((a) => a.isActive)
    : [];

  return (
    <main>
      <HeroSection t={t} waUrl={waUrl} waBookingMsg={waBookingMsg} />
      <TreatmentsSection t={t} products={displayProducts} />
      <HowToBookSection t={t} />
      <ExperienceGallerySection t={t} />
      <WhyChooseUsSection t={t} />
      <ServiceAreasSection t={t} areas={displayAreas} />
      <CtaSection t={t} waUrl={waUrl} waBookingMsg={waBookingMsg} />
    </main>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function HeroSection({ t, waUrl, waBookingMsg }: { t: ReturnType<typeof useLanguage>['t']; waUrl: (s: string) => string; waBookingMsg: string }) {
  const trustBadges = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      ),
      title: t.benefits.licensed,
      desc: t.benefits.licensedDesc,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      title: t.benefits.mobile,
      desc: t.benefits.mobileDesc,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      title: t.benefits.fast,
      desc: t.benefits.fastDesc,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
      ),
      title: t.benefits.premium,
      desc: t.benefits.premiumDesc,
    },
  ];

  return (
    <section className="hero landing-hero" id="hero" aria-label="Drips To You Bali">
      <div className="hero-content landing-hero-content">
        <h1 className="hero-title landing-hero-title">
          {t.hero.line1}<br />
          {t.hero.line2},<br />
          <em>{t.hero.lineEm}.</em>
        </h1>

        <div className="hero-accent-line landing-hero-accent" aria-hidden="true" />

        <p className="hero-sub landing-hero-sub">{t.hero.sub}</p>

        <div className="hero-cta landing-hero-cta">
          <Link
            href="/booking"
            className="btn-wa-hero landing-hero-primary"
            prefetch
            id="hero-cta-book"
          >
            {t.hero.bookWa}
            {ARROW_SVG}
          </Link>
          <Link href="/treatments" className="btn-ghost-hero landing-hero-secondary" prefetch id="hero-cta-treatments">
            {t.hero.seeAll}
          </Link>
        </div>

        {/* Trust badges strip */}
        <div className="hero-trust-badges">
          {trustBadges.map((badge, i) => (
            <div key={i} className="hero-trust-badge">
              <div className="hero-trust-icon">{badge.icon}</div>
              <div>
                <div className="hero-trust-title">{badge.title}</div>
                <div className="hero-trust-desc">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo — right side */}
      <div className="hero-photo-wrap landing-hero-media" aria-hidden="true">
        <Image
          src={BRAND.photo1}
          alt="Perawat Drips To You Bali di villa"
          fill
          priority
          quality={100}
          sizes="100vw"
          className="hero-photo landing-hero-photo landing-hero-photo--desktop"
        />
        <Image
          src={BRAND.photo1Mobile}
          alt="Perawat Drips To You Bali"
          fill
          priority
          quality={100}
          sizes="100vw"
          className="hero-photo landing-hero-photo landing-hero-photo--mobile"
        />
        <div className="hero-photo-overlay landing-hero-overlay" />

        {/* Floating multi-currency card */}
        <div className="hero-mc-float">
          <div className="hero-mc-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            <span className="hero-mc-title">Multi-Currency Pricing</span>
          </div>
          <p className="hero-mc-desc">Choose your preferred currency per treatment.</p>
          <div className="hero-mc-currencies">
            <span className="hero-mc-currency">IDR</span>
            <span className="hero-mc-currency">$</span>
            <span className="hero-mc-currency">A$</span>
            <span className="hero-mc-currency">€</span>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────
   TREATMENTS
───────────────────────────────────────────── */
function TreatmentsSection({ t, products }: { t: ReturnType<typeof useLanguage>['t']; products: HomepageProduct[] }) {
  const { lang } = useLanguage();
  const [cardCurrencies, setCardCurrencies] = useState<Record<string, string>>({});

  if (products.length === 0) return null;

  function getCardCurrency(product: HomepageProduct): string {
    const available = getAvailableCurrencies(product);
    const saved = cardCurrencies[product.id];
    if (saved && available.includes(saved)) return saved;
    return available[0] ?? normalizeCurrency(product.currency);
  }

  function setCardCurrency(productId: string, currency: string) {
    setCardCurrencies(prev => ({ ...prev, [productId]: currency }));
  }

  return (
    <section className="sec treatments-sec" id="treatments">
      <div className="sec-inner">
        {/* Section header */}
        <div className="treatments-hdr-row reveal">
          <div>
            <div className="sec-eyebrow">{t.treatments.eyebrow}</div>
            <h2 className="sec-title">{t.treatments.title} <em>{t.treatments.titleEm}</em></h2>
            <p className="sec-desc">{t.treatments.desc}</p>
          </div>
          <div className="treatments-currency-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{lang === 'en' ? 'Prices update automatically.' : 'Harga diperbarui otomatis.'}</span>
          </div>
        </div>

        <div className="treatments-grid">
          {products.slice(0, 6).map((p, i) => {
            const available = getAvailableCurrencies(p);
            const selectedCurrency = getCardCurrency(p);
            const primaryPrice = getPrimaryPrice(p, selectedCurrency);
            const secondaryPrices = getSecondaryPrices(p, selectedCurrency);
            const hasMultiCurrency = available.length > 1;

            return (
              <div key={p.id} className="t-card reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
                <div className="t-card-img">
                  {p.image_url ? (
                    <Image
                      className="card-photo"
                      src={p.image_url}
                      alt={`${p.name} IV Therapy Bali`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                      unoptimized
                    />
                  ) : (
                    <div className="t-card-img-placeholder" />
                  )}
                  {p.label && (
                    <span className={`t-badge${p.label === 'Baru' || p.label === 'New' ? ' new' : ''}`}>
                      {p.label}
                    </span>
                  )}
                </div>

                <div className="t-body">
                  <div className="t-name-row">
                    <span className="t-drop-icon">{DROP_SVG}</span>
                    <div className="t-name">{p.name}</div>
                  </div>

                  {p.short_description && <div className="t-detail">{p.short_description}</div>}

                  {p.duration_minutes && (
                    <div className="t-duration">
                      {CLOCK_SVG}
                      <span>{p.duration_minutes} min</span>
                    </div>
                  )}

                  {hasMultiCurrency && (
                    <div className="t-currency-row">
                      <span className="t-currency-label">
                        {lang === 'en' ? 'Currency' : 'Mata Uang'}
                      </span>
                      <div className="t-currency-tabs">
                        {available.map(code => (
                          <button
                            key={code}
                            className={`t-currency-tab${selectedCurrency === code ? ' active' : ''}`}
                            onClick={() => setCardCurrency(p.id, code)}
                            type="button"
                            aria-pressed={selectedCurrency === code}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="t-price">{primaryPrice}</div>
                  {secondaryPrices && (
                    <div className="t-price-secondary">{secondaryPrices}</div>
                  )}

                  <div className="t-actions">
                    <Link href={`/treatments/${p.slug}`} className="btn-see-more" prefetch>
                      {t.treatments.seeMore}
                    </Link>
                    <Link href={`/booking?treatment=${p.slug}`} className="btn-book" prefetch>
                      {t.treatments.bookNow}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="treatments-footer-note reveal">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            {lang === 'en'
              ? 'Taxes may vary by location. Local pricing in Indonesian Rupiah.'
              : 'Pajak dapat bervariasi berdasarkan lokasi. Harga lokal dalam Rupiah Indonesia.'}
          </span>
        </div>

        {/* Info boxes */}
        <div className="treatments-info-boxes reveal">
          <div className="treatments-info-box">
            <div className="treatments-info-box-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <div className="treatments-info-box-title">
                {lang === 'en' ? 'Local pricing in Indonesian Rupiah' : 'Harga lokal dalam Rupiah Indonesia'}
              </div>
              <div className="treatments-info-box-desc">
                {lang === 'en' ? 'Best value for residents and locals.' : 'Nilai terbaik untuk warga dan penduduk lokal.'}
              </div>
            </div>
          </div>
          <div className="treatments-info-box">
            <div className="treatments-info-box-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            </div>
            <div>
              <div className="treatments-info-box-title">
                {lang === 'en' ? 'International guest-friendly pricing' : 'Harga ramah tamu internasional'}
              </div>
              <div className="treatments-info-box-desc">
                {lang === 'en' ? 'Transparent, auto-converted for travelers.' : 'Transparan, dikonversi otomatis untuk wisatawan.'}
              </div>
            </div>
          </div>
        </div>

        <div className="treatments-foot reveal">
          <Link href="/treatments" className="btn-view-all" prefetch>
            {t.treatments.seeAll}
            {ARROW_SVG}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HOW TO BOOK — WELLNESS MADE SIMPLE
───────────────────────────────────────────── */
const HOW_ICONS = [
  /* Calendar */
  <svg key="h0" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>,
  /* Home */
  <svg key="h1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>,
  /* IV drop */
  <svg key="h2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>,
  /* Heart */
  <svg key="h3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>,
];

function HowToBookSection({ t }: { t: ReturnType<typeof useLanguage>['t'] }) {
  return (
    <section className="sec how-sec" id="how-to-book">
      <div className="sec-inner">
        <div className="how-split">
          {/* Left: text */}
          <div className="how-split-left reveal">
            <div className="sec-eyebrow">{t.howToBook.eyebrow}</div>
            <h2 className="sec-title" style={{ marginTop: 12 }}>
              {t.howToBook.title} <em>{t.howToBook.titleEm}</em>
            </h2>
            <p className="sec-desc" style={{ marginTop: 16 }}>{t.howToBook.sub}</p>
            <div style={{ marginTop: 32 }}>
              <Link href="/booking" className="btn-view-all" prefetch>
                {t.cta.bookNow}
                {ARROW_SVG}
              </Link>
            </div>
          </div>

          {/* Right: 2×2 step grid */}
          <div className="how-steps-grid">
            {t.howToBook.steps.map((s, i) => (
              <div key={i} className="how-step-card reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="how-step-top">
                  <div className="how-step-num">{i + 1}</div>
                  <div className="how-step-icon">{HOW_ICONS[i]}</div>
                </div>
                <div className="how-step-title">{s.title}</div>
                <p className="how-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   EXPERIENCE GALLERY
───────────────────────────────────────────── */
function ExperienceGallerySection({ t }: { t: ReturnType<typeof useLanguage>['t'] }) {
  const images = [BRAND.photo2, BRAND.photo3, BRAND.photo4, BRAND.photo5];

  return (
    <section className="gallery-sec" id="gallery">
      <div className="sec-inner">
        <div className="sec-hdr centered reveal">
          <div className="sec-eyebrow">{t.gallery.eyebrow}</div>
          <h2 className="sec-title">{t.gallery.title} <em>{t.gallery.titleEm}</em></h2>
          <p className="sec-desc">{t.gallery.desc}</p>
        </div>
        <div className="gallery-grid">
          {images.map((src, i) => (
            <div key={i} className="gallery-item reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <Image src={src} alt="Drips To You Bali Experience" fill sizes="(max-width: 768px) 50vw, 25vw" className="gallery-img" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   WHY CHOOSE US
───────────────────────────────────────────── */
const WHY_ICONS = [
  <svg key="why-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>,
  <svg key="why-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
  <svg key="why-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>,
  <svg key="why-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>,
  <svg key="why-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>,
];

function WhyChooseUsSection({ t }: { t: ReturnType<typeof useLanguage>['t'] }) {
  return (
    <section className="why-sec" id="why-choose-us" aria-labelledby="why-title">
      <div className="sec-inner">
        <div className="sec-hdr centered reveal">
          <div className="sec-eyebrow">{t.whyChooseUs.eyebrow}</div>
          <h2 className="sec-title" id="why-title">
            {t.whyChooseUs.title} <em>{t.whyChooseUs.titleEm}</em>
          </h2>
          <p className="sec-desc">{t.whyChooseUs.desc}</p>
        </div>

        <div className="why-img-banner reveal" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '560px', minHeight: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '48px', boxShadow: 'var(--shadow-card)' }}>
          <Image src={BRAND.photoWhy} alt="Drips To You Bali - Mobile IV Therapy Service" fill style={{ objectFit: 'cover', objectPosition: 'center center' }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px" />
        </div>

        <div className="why-grid">
          {t.whyChooseUs.items.map((item, i) => (
            <div key={i} className="why-card reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className="why-card-icon">{WHY_ICONS[i]}</div>
              <h3 className="why-card-title">{item.title}</h3>
              <p className="why-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SERVICE AREAS
───────────────────────────────────────────── */
function ServiceAreasSection({ t, areas }: { t: ReturnType<typeof useLanguage>['t']; areas: ServiceAreaData[] }) {
  const { lang } = useLanguage();
  const POPULAR_NAMES = new Set(['Seminyak', 'Canggu', 'Ubud', 'Nusa Dua']);

  if (!areas || areas.length === 0) return null;

  return (
    <section className="areas-sec" id="areas">
      <div className="areas-orb areas-orb-1" aria-hidden="true" />
      <div className="areas-orb areas-orb-2" aria-hidden="true" />
      <div className="areas-orb areas-orb-3" aria-hidden="true" />

      <div className="areas-header-pad">
        <div className="sec-eyebrow">{t.areas.eyebrow}</div>
        <h2 className="sec-title" style={{ marginTop: 12, color: 'white' }}>
          {t.areas.title} <em style={{ color: 'var(--champagne)' }}>{t.areas.titleEm}</em>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', maxWidth: 520, marginTop: 14, lineHeight: 1.75 }}>
          {t.areas.desc}
        </p>

        <div className="areas-live-badge" style={{ marginTop: 24 }}>
          <span className="live-dot" />
          {t.areas.liveService}
        </div>
      </div>

      <div className="areas-content-pad">
        {areas.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', padding: 40 }}>
            Informasi area layanan segera tersedia.{' '}
            <Link href="/booking" style={{ color: 'var(--soft-aqua)', fontWeight: 600 }}>Hubungi kami</Link>
          </div>
        ) : (
          <div className="areas-cards-grid">
            {areas.map((a, i) => {
              const popular = POPULAR_NAMES.has(a.name);
              return (
                <div
                  key={a.id}
                  className={`area-card${popular ? ' area-card-popular' : ''}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="area-card-top">
                    <div className="area-card-pin">
                      <svg viewBox="0 0 14 18" xmlns="http://www.w3.org/2000/svg" width="10" height="13">
                        <path d="M7 0C3.13 0 0 3.13 0 7c0 4.87 7 11 7 11s7-6.13 7-11C14 3.13 10.87 0 7 0zm0 9.5C5.62 9.5 4.5 8.38 4.5 7S5.62 4.5 7 4.5 9.5 5.62 9.5 7 8.38 9.5 7 9.5z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="area-card-name">{a.name}</div>
                      {a.note && <div className="area-card-type">{a.note}</div>}
                    </div>
                    {popular && (
                      <span className="area-card-badge-popular">{t.areas.popular?.replace('★ ', '') ?? 'Popular'}</span>
                    )}
                  </div>
                  <div className="area-card-footer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>
                      {t.areas.arrivalTime ?? 'Estimasi tiba'}:{' '}
                      <strong>{arrivalLabel(a.estimatedArrivalMinutes, lang)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32, color: 'rgba(255,255,255,.5)', fontSize: 13, lineHeight: 1.6 }}>
          {t.areas.notInList ?? 'Area kamu tidak ada di list?'}{' '}
          <Link href="/booking" style={{ color: 'var(--soft-aqua)', fontWeight: 600 }}>
            {t.areas.contactUs ?? 'Hubungi kami'}
          </Link>
        </div>
      </div>

      <div className="areas-marquee-wrap">
        <div className="areas-marquee-track">
          {[...areas, ...areas].map((a, i) => (
            <span key={i} className="marq-item">{a.name}<span className="marq-sep" /></span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA
───────────────────────────────────────────── */
function CtaSection({ t, waUrl, waBookingMsg }: { t: ReturnType<typeof useLanguage>['t']; waUrl: (s: string) => string; waBookingMsg: string }) {
  return (
    <section className="cta-sec">
      <div className="cta-inner reveal">
        <div className="cta-badge">
          {BOLT_SVG}
          {t.cta.badge}
        </div>
        <h2 className="cta-title">{t.cta.title} <em>{t.cta.titleEm}</em></h2>
        <p className="cta-sub">{t.cta.sub}</p>
        <div className="cta-btns">
          <Link href="/booking" className="btn-cta-primary" prefetch>
            {t.cta.bookNow}
            {ARROW_SVG}
          </Link>
          <a href={waUrl(waBookingMsg)} className="btn-cta-wa" target="_blank" rel="noopener noreferrer">
            {WA_SVG}
            {t.cta.bookWa}
          </a>
        </div>
      </div>
    </section>
  );
}
