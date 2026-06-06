'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';

export interface HomepageProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price_amount: number;
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
  logo:   `${IK}/drips-to-you-bali-icon.webp`,
  photo1: `${IK}/photo_6134052561527443398_y.webp`, // on-site service / hero
  photo2: `${IK}/photo_6134052561527443396_y.webp`, // medical team / preparation
  photo3: `${IK}/photo_6131724036417982600_y.webp`, // IV drip visual
  photo4: `${IK}/photo_6134052561527443397_y.webp`, // villa/hotel service
  photo5: `${IK}/photo_6134052561527443395_y.webp`, // team portrait
};

const WA_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
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

const FALLBACK_PRODUCTS: HomepageProduct[] = [
  { id: '1', name: 'Hangover Recovery', slug: 'hangover-recovery', short_description: 'Rehidrasi cepat dengan elektrolit, vitamin B & C, dan anti-mual untuk pemulihan optimal setelah malam panjang.', price_amount: 750000, price_label: 'IDR 750.000', image_url: BRAND.photo3, label: 'Populer', show_on_homepage: true, homepage_order: 1 },
  { id: '2', name: 'Immune Booster',    slug: 'immune-booster',    short_description: 'Tingkatkan sistem imun dengan vitamin C dosis tinggi, zinc, dan glutathione untuk perlindungan optimal.', price_amount: 650000, price_label: 'IDR 650.000', image_url: BRAND.photo2, label: 'Terlaris', show_on_homepage: true, homepage_order: 2 },
  { id: '3', name: 'Energy Boost',      slug: 'energy-boost',      short_description: 'Kembalikan stamina dan energimu dengan B-complex, magnesium, dan elektrolit lengkap yang bekerja cepat.', price_amount: 550000, price_label: 'IDR 550.000', image_url: BRAND.photo4, label: null, show_on_homepage: true, homepage_order: 3 },
  { id: '4', name: 'Beauty Glow',       slug: 'beauty-glow',       short_description: 'Tampil lebih cerah dan glowing dengan glutathione, kolagen booster, dan antioksidan premium.', price_amount: 700000, price_label: 'IDR 700.000', image_url: BRAND.photo5, label: 'Baru', show_on_homepage: true, homepage_order: 4 },
];

const FALLBACK_AREAS: ServiceAreaData[] = [
  { id: '1',  name: 'Seminyak',        isActive: true, estimatedArrivalMinutes: 20,  note: 'Villa · Beach · Nightlife', sortOrder: 1  },
  { id: '2',  name: 'Canggu',          isActive: true, estimatedArrivalMinutes: 27,  note: 'Surf · Lifestyle',          sortOrder: 2  },
  { id: '3',  name: 'Kuta',            isActive: true, estimatedArrivalMinutes: 20,  note: 'Tourist · Beach',           sortOrder: 3  },
  { id: '4',  name: 'Ubud',            isActive: true, estimatedArrivalMinutes: 52,  note: 'Culture · Nature',          sortOrder: 4  },
  { id: '5',  name: 'Nusa Dua',        isActive: true, estimatedArrivalMinutes: 32,  note: 'Resort · Luxury',           sortOrder: 5  },
  { id: '6',  name: 'Jimbaran',        isActive: true, estimatedArrivalMinutes: 37,  note: 'Beach · Sunset',            sortOrder: 6  },
  { id: '7',  name: 'Legian',          isActive: true, estimatedArrivalMinutes: 20,  note: 'Beach · Shopping',          sortOrder: 7  },
  { id: '8',  name: 'Sanur',           isActive: true, estimatedArrivalMinutes: 32,  note: 'Calm · Beach',              sortOrder: 8  },
  { id: '9',  name: 'Denpasar',        isActive: true, estimatedArrivalMinutes: 27,  note: 'City · Local',              sortOrder: 9  },
  { id: '10', name: 'Uluwatu',         isActive: true, estimatedArrivalMinutes: 47,  note: 'Cliff · Surf',              sortOrder: 10 },
  { id: '11', name: 'Petitenget',      isActive: true, estimatedArrivalMinutes: 22,  note: 'Trendy · Villa',            sortOrder: 11 },
  { id: '12', name: 'Bukit Peninsula', isActive: true, estimatedArrivalMinutes: 42,  note: 'Scenic · Luxury',           sortOrder: 12 },
];

function arrivalLabel(minutes: number | null): string {
  if (!minutes) return '30–60 min';
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
    : 'Halo Drips To You - Bali, saya ingin booking treatment IV therapy';

  const displayProducts = homepageProducts && homepageProducts.length > 0 ? homepageProducts : FALLBACK_PRODUCTS;
  const displayAreas    = serviceAreas && serviceAreas.length > 0
    ? serviceAreas.filter((a) => a.isActive)
    : FALLBACK_AREAS;

  return (
    <main>
      <HeroSection t={t} waUrl={waUrl} waBookingMsg={waBookingMsg} />
      <BenefitsStrip t={t} />
      <TreatmentsSection t={t} products={displayProducts} />
      <WhyChooseUsSection />
      <HowToBookSection t={t} />
      <ServiceAreasSection t={t} areas={displayAreas} />
      <TestimonialsSection t={t} />
      <CtaSection t={t} waUrl={waUrl} waBookingMsg={waBookingMsg} />
    </main>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function HeroSection({ t, waUrl, waBookingMsg }: { t: ReturnType<typeof useLanguage>['t']; waUrl: (s: string) => string; waBookingMsg: string }) {
  return (
    <section className="hero" id="hero" aria-label="Hero">
      <div className="hero-media" aria-hidden="true">
        <Image
          src={BRAND.photo1}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-photo"
        />
      </div>
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-glow-1" aria-hidden="true" />
      <div className="hero-glow-2" aria-hidden="true" />

      <svg className="hero-deco" viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="380" cy="180" rx="160" ry="220" fill="rgba(142,191,191,0.5)" transform="rotate(15 380 180)" />
        <ellipse cx="180" cy="500" rx="130" ry="170" fill="rgba(234,212,174,0.4)" transform="rotate(-20 180 500)" />
        <rect x="200" y="80" width="100" height="160" rx="50" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <rect x="235" y="240" width="30" height="8" rx="4" fill="rgba(255,255,255,0.25)" />
        <line x1="250" y1="248" x2="250" y2="380" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        <circle cx="250" cy="388" r="18" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <rect x="288" y="108" width="24" height="8" rx="4" fill="rgba(255,255,255,0.4)" />
        <rect x="296" y="100" width="8" height="24" rx="4" fill="rgba(255,255,255,0.4)" />
        <path d="M60 420 Q150 300 230 380 Q160 440 60 420Z" fill="rgba(142,191,191,0.35)" />
        <path d="M340 540 Q440 440 480 530 Q440 580 340 540Z" fill="rgba(142,191,191,0.25)" />
      </svg>

      <div className="hero-content">
        <div className="hero-pill">
          <span className="pill-dot" />
          {t.hero.pill}
        </div>

        <h1 className="hero-title">
          {t.hero.line1}<br />{t.hero.line2}<br />
          <em>{t.hero.lineEm}</em>
        </h1>

        <p className="hero-sub">{t.hero.sub}</p>

        <div className="hero-cta">
          <Link href="/booking" className="btn-wa-hero" prefetch>
            {t.hero.bookWa}
          </Link>
          <a href={waUrl(waBookingMsg)} className="btn-ghost-hero" target="_blank" rel="noopener noreferrer">
            {WA_SVG}
            {t.hero.seeAll}
            {ARROW_SVG}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   BENEFITS STRIP
───────────────────────────────────────────── */
function BenefitsStrip({ t }: { t: ReturnType<typeof useLanguage>['t'] }) {
  const items = [
    { icon: <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>, title: t.benefits.fast, desc: t.benefits.fastDesc },
    { icon: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, title: t.benefits.licensed, desc: t.benefits.licensedDesc },
    { icon: <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, title: t.benefits.mobile, desc: t.benefits.mobileDesc },
    { icon: <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>, title: t.benefits.premium, desc: t.benefits.premiumDesc },
  ];

  return (
    <section className="benefits" aria-label="Key benefits">
      <div className="benefits-inner">
        {items.map((item, i) => (
          <div key={i} className="bene-item reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
            <div className="bene-icon">{item.icon}</div>
            <div>
              <div className="bene-title">{item.title}</div>
              <div className="bene-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TREATMENTS
───────────────────────────────────────────── */
function TreatmentsSection({ t, products }: { t: ReturnType<typeof useLanguage>['t']; products: HomepageProduct[] }) {
  function formatPrice(p: HomepageProduct) {
    return p.price_label ?? `IDR ${p.price_amount.toLocaleString('id-ID')}`;
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
   WHY CHOOSE US
───────────────────────────────────────────── */
const WHY_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: 'Convenient On-Site Service',
    desc:  'No hassle, no travel. We bring professional medical care directly to your villa, hotel, home, or office anywhere in Bali.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Expert Medical Team',
    desc:  'Your health is in good hands. All treatments are delivered by certified, highly experienced healthcare professionals.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'Fast & Responsive Care',
    desc:  'No long queues or waiting times. Our team is ready to respond swiftly whenever you need us.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    title: 'Accessible for Everyone',
    desc:  'Whether you are a tourist enjoying a vacation, an expat, or a local resident, we are here for you.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: 'Safe, Comfortable & Trusted',
    desc:  'Experience premium, stress-free wellness care in the comfort of your own space.',
  },
];

function WhyChooseUsSection() {
  return (
    <section className="why-sec" id="why-choose-us" aria-labelledby="why-title">
      <div className="sec-inner">
        <div className="sec-hdr centered reveal">
          <div className="sec-eyebrow">Why Choose Us</div>
          <h2 className="sec-title" id="why-title">
            The Drips To You <em>Difference</em>
          </h2>
          <p className="sec-desc">
            We believe exceptional wellness care should come to you — wherever you are in Bali.
          </p>
        </div>

        <div className="why-grid">
          {WHY_ITEMS.map((item, i) => (
            <div key={i} className="why-card reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className="why-card-icon">{item.icon}</div>
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
  const POPULAR_NAMES = new Set(['Seminyak', 'Canggu', 'Ubud', 'Nusa Dua']);

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

        <div className="areas-stats">
          <div>
            <div className="area-stat-num">{areas.length}</div>
            <div className="area-stat-lbl">{t.areas.areaCount}</div>
          </div>
          <div>
            <div className="area-stat-num">60<sub>min</sub></div>
            <div className="area-stat-lbl">{t.areas.responseTime}</div>
          </div>
          <div>
            <div className="area-stat-num">100%</div>
            <div className="area-stat-lbl">{t.areas.coverage}</div>
          </div>
        </div>

        <div className="areas-live-badge">
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
                      <strong>{arrivalLabel(a.estimatedArrivalMinutes)}</strong>
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
function TestimonialsSection({ t }: { t: ReturnType<typeof useLanguage>['t'] }) {
  return (
    <section className="sec testi-sec">
      <div className="sec-inner">
        <div className="sec-hdr centered reveal">
          <div className="sec-eyebrow">{t.testimonials.eyebrow}</div>
          <h2 className="sec-title">{t.testimonials.title} <em>{t.testimonials.titleEm}</em></h2>
          <p className="sec-desc">{t.testimonials.sub}</p>
        </div>
        <div className="testi-grid">
          {t.testimonials.cards.map((c, i) => (
            <div key={i} className="testi-card reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="testi-open">&ldquo;</div>
              <div className="testi-stars">{Array.from({ length: 5 }).map((_, j) => <span key={j}>★</span>)}</div>
              <p className="testi-text">{c.text}</p>
              <div className="testi-author">
                <div className="testi-av">{c.name.charAt(0)}</div>
                <div>
                  <div className="testi-name">{c.name}</div>
                  <div className="testi-loc">{c.loc}</div>
                </div>
                <span className="testi-tag">{c.tag}</span>
              </div>
            </div>
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
