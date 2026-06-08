'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';
import { formatPrice as formatCurrencyPrice } from '@/lib/currency';

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

/* ── Brand image URLs ── */
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

function arrivalLabel(minutes: number | null, lang: 'en' | 'id'): string {
  if (!minutes) return lang === 'en' ? 'Confirm with our team' : 'Konfirmasi dengan tim';
  const lo = Math.max(10, minutes - 10);
  const hi = minutes + 10;
  return `${lo}–${hi} min`;
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
      <ExperienceGallerySection t={t} />
      <WhyChooseUsSection t={t} />
      <HowToBookSection t={t} />
      <ServiceAreasSection t={t} areas={displayAreas} />
      <CtaSection t={t} waUrl={waUrl} waBookingMsg={waBookingMsg} />
    </main>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function HeroSection({ t, waUrl, waBookingMsg }: { t: ReturnType<typeof useLanguage>['t']; waUrl: (s: string) => string; waBookingMsg: string }) {
  return (
    <section className="hero landing-hero" id="hero" aria-label="Drips To You Bali">
      {/* Text content — left column */}
      <div className="hero-content landing-hero-content">
        <h1 className="hero-title landing-hero-title">
          {t.hero.line1}<br />
          {t.hero.line2},<br />
          <em>{t.hero.lineEm}.</em>
        </h1>

        <div className="hero-accent-line landing-hero-accent" aria-hidden="true" />

        <p className="hero-sub landing-hero-sub">{t.hero.sub}</p>

        <div className="hero-cta landing-hero-cta">
          <a
            href={waUrl(waBookingMsg)}
            className="btn-wa-hero landing-hero-primary"
            target="_blank"
            rel="noopener noreferrer"
            id="hero-cta-wa"
          >
            {WA_SVG}
            {t.hero.bookWa}
          </a>
          <Link href="/treatments" className="btn-ghost-hero landing-hero-secondary" prefetch id="hero-cta-treatments">
            {t.hero.seeAll}
            {ARROW_SVG}
          </Link>
        </div>
      </div>

      {/* Photo — right side, no blur/filter */}
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
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────
   TREATMENTS
───────────────────────────────────────────── */
function TreatmentsSection({ t, products }: { t: ReturnType<typeof useLanguage>['t']; products: HomepageProduct[] }) {
  if (products.length === 0) return null;

  function formatPrice(p: HomepageProduct) {
    return p.price_label ?? formatCurrencyPrice(p.price_amount, p.currency);
  }

  const imgClasses = ['t-img-hangover', 't-img-immune', 't-img-energy', 't-img-beauty'];

  return (
    <section className="sec treatments-sec" id="treatments">
      <div className="sec-inner">
        <div className="sec-hdr reveal">
          <div className="sec-eyebrow">{t.treatments.eyebrow}</div>
          <h2 className="sec-title">{t.treatments.title} <em>{t.treatments.titleEm}</em></h2>
          <p className="sec-desc">{t.treatments.desc}</p>
        </div>

        <div className="treatments-grid">
          {products.slice(0, 4).map((p, i) => (
            <div key={p.id} className="t-card reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className={`t-card-img ${imgClasses[i % imgClasses.length]}`}>
                {p.image_url && (
                  <Image
                    className="card-photo"
                    src={p.image_url}
                    alt={`${p.name} IV Therapy Bali`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                    unoptimized
                  />
                )}
                {p.label && (
                  <span className={`t-badge${p.label === 'Baru' || p.label === 'New' ? ' new' : ''}`}>
                    {p.label}
                  </span>
                )}
              </div>
              <div className="t-body">
                <div className="t-name">{p.name}</div>
                {p.short_description && <div className="t-detail">{p.short_description}</div>}
                <div className="t-price">{formatPrice(p)} <span>{t.treatments.perSession}</span></div>
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
          ))}
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
  (
    <svg key="why-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  (
    <svg key="why-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  (
    <svg key="why-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  (
    <svg key="why-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  (
    <svg key="why-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
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
          <p className="sec-desc">
            {t.whyChooseUs.desc}
          </p>
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
   HOW TO BOOK
───────────────────────────────────────────── */
function HowToBookSection({ t }: { t: ReturnType<typeof useLanguage>['t'] }) {
  return (
    <section className="sec how-sec" id="how-to-book">
      <div className="sec-inner">
        <div className="sec-hdr centered reveal">
          <div className="sec-eyebrow">{t.howToBook.eyebrow}</div>
          <h2 className="sec-title">{t.howToBook.title} <em>{t.howToBook.titleEm}</em></h2>
          <p className="sec-desc">{t.howToBook.sub}</p>
        </div>
        <div className="steps-row">
          {t.howToBook.steps.map((s, i) => (
            <div key={i} className="step-item reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
              <div className="step-num">{i + 1}</div>
              <div className="step-content">
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }} className="reveal">
          <Link href="/booking" className="btn-view-all" prefetch>
            {t.cta.bookNow}
            {ARROW_SVG}
          </Link>
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
   TESTIMONIALS
───────────────────────────────────────────── */
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
