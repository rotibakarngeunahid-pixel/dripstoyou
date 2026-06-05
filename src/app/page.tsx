import Link from 'next/link';
import Header from '@/components/public/Header';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';

const WA_NUMBER = process.env.WHATSAPP_NUMBER ?? '6281200000000';

function waUrl(text: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

const WA_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const PIN_SVG = (
  <svg viewBox="0 0 14 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 0C3.13 0 0 3.13 0 7c0 4.87 7 11 7 11s7-6.13 7-11C14 3.13 10.87 0 7 0zm0 9.5C5.62 9.5 4.5 8.38 4.5 7S5.62 4.5 7 4.5 9.5 5.62 9.5 7 8.38 9.5 7 9.5z" />
  </svg>
);

export default function HomePage() {
  return (
    <>
      <Header waNumber={WA_NUMBER} />
      <ScrollRevealInit />
      <main>
        <HeroSection />
        <BenefitsStrip />
        <TreatmentsSection />
        <HowToBookSection />
        <ServiceAreasSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <SiteFooter />
      <a
        href={waUrl('Halo DRIP TO YOU Bali, saya ingin booking treatment IV therapy')}
        className="wa-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat via WhatsApp"
      >
        {WA_SVG}
      </a>
    </>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="hero" id="hero" aria-label="Hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-glow-1" aria-hidden="true" />
      <div className="hero-glow-2" aria-hidden="true" />

      <svg
        className="hero-deco"
        viewBox="0 0 500 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
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
        <path d="M420 300 Q430 280 440 300 Q440 316 430 318 Q420 316 420 300Z" fill="rgba(255,255,255,0.25)" />
        <path d="M90 200 Q97 185 104 200 Q104 212 97 213 Q90 212 90 200Z" fill="rgba(255,255,255,0.2)" />
      </svg>

      <div className="hero-content">
        <div className="hero-pill">
          <span className="pill-dot" />
          Now Available in Bali
        </div>

        <h1 className="hero-title">
          Hydration &amp;<br />Recovery<br />
          <em>Delivered to You</em>
        </h1>

        <p className="hero-sub">
          Mobile IV therapy oleh tim medis bersertifikat — langsung ke villa, hotel, atau Airbnb kamu di seluruh Bali.
        </p>

        <div className="hero-cta">
          <a
            href={waUrl('Halo DRIP TO YOU Bali, saya ingin booking treatment IV therapy')}
            className="btn-wa-hero"
            target="_blank"
            rel="noopener noreferrer"
          >
            {WA_SVG}
            Book via WhatsApp
          </a>
          <a href="#treatments" className="btn-ghost-hero">
            Lihat Semua Treatment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   BENEFITS STRIP
───────────────────────────────────────────── */
function BenefitsStrip() {
  const items = [
    {
      icon: <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
      title: 'Fast Response',
      desc: 'Tim tiba dalam 60 menit ke lokasi Anda',
    },
    {
      icon: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
      title: 'Licensed Team',
      desc: 'Tenaga medis & perawat bersertifikat',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      title: 'Mobile Service',
      desc: 'Datang ke villa, hotel, atau Airbnb',
    },
    {
      icon: <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
      title: 'Premium Care',
      desc: 'Produk & peralatan medis berkualitas',
    },
  ];

  return (
    <section className="benefits" aria-label="Why choose us">
      <div className="benefits-inner">
        {items.map((item, i) => (
          <div key={item.title} className="bene-item reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
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
function TreatmentsSection() {
  const treatments = [
    {
      slug: 'hangover-recovery',
      imgClass: 't-img-hangover',
      photo: 'https://images.pexels.com/photos/3259629/pexels-photo-3259629.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop',
      badge: 'Popular',
      badgeClass: '',
      name: 'Hangover Recovery',
      detail: 'Rehidrasi cepat · Vitamin B & C · Anti-nausea',
      price: 'IDR 750.000',
      waText: 'Halo, saya ingin booking Hangover Recovery',
    },
    {
      slug: 'immune-booster',
      imgClass: 't-img-immune',
      photo: 'https://images.pexels.com/photos/4021779/pexels-photo-4021779.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop',
      badge: 'Best Seller',
      badgeClass: '',
      name: 'Immune Booster',
      detail: 'Vitamin C high-dose · Zinc · Glutathione',
      price: 'IDR 650.000',
      waText: 'Halo, saya ingin booking Immune Booster',
    },
    {
      slug: 'energy-boost',
      imgClass: 't-img-energy',
      photo: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop',
      badge: null,
      badgeClass: '',
      name: 'Energy Boost',
      detail: 'B-complex · Magnesium · Elektrolit penuh',
      price: 'IDR 550.000',
      waText: 'Halo, saya ingin booking Energy Boost',
    },
    {
      slug: 'beauty-glow',
      imgClass: 't-img-beauty',
      photo: 'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop',
      badge: 'New',
      badgeClass: 'new',
      name: 'Beauty Glow',
      detail: 'Glutathione · Collagen boost · Antioksidan',
      price: 'IDR 700.000',
      waText: 'Halo, saya ingin booking Beauty Glow',
    },
  ];

  return (
    <section className="sec treatments-sec" id="treatments">
      <div className="sec-inner">
        <div className="sec-hdr reveal">
          <div className="sec-eyebrow">Our Treatments</div>
          <h2 className="sec-title">Feel Good <em>in Hours</em></h2>
          <p className="sec-desc">
            Pilih treatment yang sesuai kebutuhanmu — dari pemulihan hangover hingga energy boost dan glowing skin.
          </p>
        </div>

        <div className="treatments-grid">
          {treatments.map((t, i) => (
            <div key={t.slug} className="t-card reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className={`t-card-img ${t.imgClass}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="card-photo" src={t.photo} alt={`${t.name} IV Therapy`} loading="lazy" />
                {t.badge && (
                  <span className={`t-badge${t.badgeClass ? ' ' + t.badgeClass : ''}`}>{t.badge}</span>
                )}
              </div>
              <div className="t-body">
                <div className="t-name">{t.name}</div>
                <div className="t-detail">{t.detail}</div>
                <div className="t-price">{t.price} <span>/ sesi</span></div>
                <a href={waUrl(t.waText)} className="btn-book" target="_blank" rel="noopener noreferrer">
                  Book Now
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="treatments-foot reveal">
          <Link href="/treatments" className="btn-view-all">
            Lihat Semua Treatment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HOW TO BOOK
───────────────────────────────────────────── */
function HowToBookSection() {
  const steps = [
    { n: '1', title: 'Pilih Treatment', desc: 'Browse pilihan IV therapy kami dan tentukan treatment yang paling sesuai dengan kondisi & kebutuhanmu saat ini.' },
    { n: '2', title: 'Chat via WhatsApp', desc: 'Hubungi kami langsung — konfirmasi jadwal, lokasi villa atau hotel, dan jumlah orang yang akan di-treatment.' },
    { n: '3', title: 'Tim Datang ke Anda', desc: 'Tim medis profesional tiba dalam 60 menit, siap memberikan treatment terbaik langsung di tempat kamu.' },
  ];

  return (
    <section className="sec how-sec" id="how-to-book">
      <div className="sec-inner">
        <div className="sec-hdr centered reveal">
          <div className="sec-eyebrow">How It Works</div>
          <h2 className="sec-title">Booking <em>dalam 3 Langkah</em></h2>
          <p className="sec-desc">Semudah chat WhatsApp — tim medis profesional kami siap hadir ke lokasi kamu.</p>
        </div>
        <div className="steps-row">
          {steps.map((s, i) => (
            <div key={s.n} className="step-item reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
              <div className="step-num">{s.n}</div>
              <div className="step-content">
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
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
function ServiceAreasSection() {
  const areas = [
    { name: 'Seminyak',        type: 'Villa · Beach · Nightlife', popular: true },
    { name: 'Canggu',          type: 'Surf · Lifestyle',          popular: false },
    { name: 'Kuta',            type: 'Tourist · Beach',           popular: false },
    { name: 'Ubud',            type: 'Culture · Nature',          popular: true },
    { name: 'Nusa Dua',        type: 'Resort · Luxury',           popular: true },
    { name: 'Jimbaran',        type: 'Beach · Sunset',            popular: false },
    { name: 'Legian',          type: 'Beach · Shopping',          popular: false },
    { name: 'Sanur',           type: 'Calm · Beach',              popular: false },
    { name: 'Denpasar',        type: 'City · Local',              popular: false },
    { name: 'Uluwatu',         type: 'Cliff · Surf',              popular: false },
    { name: 'Petitenget',      type: 'Trendy · Villa',            popular: false },
    { name: 'Bukit Peninsula', type: 'Scenic · Luxury',           popular: false },
  ];

  return (
    <section className="areas-sec" id="areas">
      <div className="areas-orb areas-orb-1" aria-hidden="true" />
      <div className="areas-orb areas-orb-2" aria-hidden="true" />
      <div className="areas-orb areas-orb-3" aria-hidden="true" />

      <div className="areas-header-pad">
        <div className="sec-eyebrow">Coverage Area</div>
        <h2 className="sec-title" style={{ marginTop: 12 }}>Area <em>Layanan Kami</em></h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', maxWidth: 500, marginTop: 14, lineHeight: 1.75 }}>
          Kami menjangkau seluruh kawasan wisata utama Bali — dari pantai barat hingga pegunungan Ubud dan semenanjung Bukit.
        </p>
        <div className="areas-stats">
          <div><div className="area-stat-num">12</div><div className="area-stat-lbl">Area Layanan</div></div>
          <div><div className="area-stat-num">60<sub>min</sub></div><div className="area-stat-lbl">Response Time</div></div>
          <div><div className="area-stat-num">100%</div><div className="area-stat-lbl">South Bali Coverage</div></div>
        </div>
        <div className="areas-live-badge">
          <span className="live-dot" />
          Layanan Aktif · 08:00 – 22:00 WITA
        </div>
      </div>

      <div className="areas-body">
        <div className="bali-map-container">
          <BaliMapSvg />
          <div className="map-legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--gold)' }} /><span>Popular zones</span></div>
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--soft-aqua)' }} /><span>All service areas</span></div>
            <div className="legend-item"><span className="legend-dot" style={{ background: 'rgba(41,128,139,.5)', border: '1px solid rgba(142,191,191,.4)' }} /><span>Live radar coverage</span></div>
          </div>
        </div>

        <div className="areas-list-panel">
          {areas.map((a, i) => (
            <div key={a.name} className="area-row" style={{ animationDelay: `${i * 0.05 + 0.05}s` }}>
              <div className={`area-row-icon${a.popular ? ' gold' : ''}`}>{PIN_SVG}</div>
              <div className="area-row-info">
                <div className="area-row-name">{a.name}</div>
                <div className="area-row-type">{a.type}</div>
              </div>
              <div className={`area-row-badge ${a.popular ? 'badge-popular' : 'badge-active'}`}>
                {a.popular ? '★ Popular' : 'Active'}
              </div>
            </div>
          ))}
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

function BaliMapSvg() {
  return (
    <svg className="bali-map-svg" viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Peta layanan DRIP TO YOU Bali">
      <defs>
        <radialGradient id="sweepFill" cx="358" cy="192" r="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(41,128,139,0.45)" />
          <stop offset="100%" stopColor="rgba(41,128,139,0)" />
        </radialGradient>
        <filter id="pinGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="mapDots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r=".6" fill="rgba(255,255,255,.08)" />
        </pattern>
      </defs>

      <rect width="700" height="420" fill="url(#mapDots)" />
      <circle cx="358" cy="192" r="60" className="cover-ring" style={{ animationDelay: '0s' }} />
      <circle cx="358" cy="192" r="60" className="cover-ring" style={{ animationDelay: '1.66s' }} />
      <circle cx="358" cy="192" r="60" className="cover-ring" style={{ animationDelay: '3.33s' }} />
      <circle cx="358" cy="192" r="115" fill="none" stroke="rgba(142,191,191,.07)" strokeWidth="1" strokeDasharray="4 7" />
      <circle cx="358" cy="192" r="205" fill="none" stroke="rgba(142,191,191,.05)" strokeWidth="1" strokeDasharray="4 8" />
      <circle cx="358" cy="192" r="300" fill="none" stroke="rgba(142,191,191,.04)" strokeWidth="1" strokeDasharray="4 9" />

      <g className="radar-group">
        <path d="M358,192 L358,-158 A350,350 0 0,1 708,192 Z" fill="url(#sweepFill)" opacity=".55" />
        <line x1="358" y1="192" x2="358" y2="-158" stroke="rgba(142,191,191,.65)" strokeWidth="1.5" />
      </g>

      <g opacity=".32">
        <path d="M28 396 Q62 384 96 396 Q130 408 164 396" fill="none" stroke="rgba(142,191,191,.45)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M28 408 Q62 396 96 408 Q130 420 164 408" fill="none" stroke="rgba(142,191,191,.28)" strokeWidth="1" strokeLinecap="round" />
        <text x="96" y="418" fontSize="8" fill="rgba(142,191,191,.35)" fontFamily="Georgia,serif" fontStyle="italic" textAnchor="middle">Indian Ocean</text>
      </g>

      <path className="bali-island-path"
        d="M 65,155 C 92,105 162,72 258,58 C 354,44 458,48 545,77 C 606,98 645,126 650,158 C 654,185 641,208 618,226 C 593,244 560,256 522,267 C 486,278 452,285 428,297 C 408,311 397,333 387,356 C 379,372 371,383 359,386 C 347,389 335,384 327,370 C 317,354 313,331 306,308 C 296,280 280,257 259,239 C 237,219 208,207 178,199 C 145,191 108,188 82,174 C 56,160 42,163 65,155 Z"
        fill="rgba(142,191,191,.08)" stroke="rgba(142,191,191,.5)" strokeWidth="1.5"
      />

      <g opacity=".22">
        <path d="M478 116 L490 90 L502 116 Z" fill="rgba(255,255,255,.5)" stroke="rgba(255,255,255,.4)" strokeWidth="1" strokeLinejoin="round" />
        <path d="M498 116 L513 82 L528 116 Z" fill="rgba(255,255,255,.35)" stroke="rgba(255,255,255,.3)" strokeWidth="1" strokeLinejoin="round" />
        <path d="M520 116 L530 98 L540 116 Z" fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.2)" strokeWidth="1" strokeLinejoin="round" />
      </g>

      <text x="352" y="30" textAnchor="middle" fontSize="8" fontWeight="600" letterSpacing="2.5" fill="rgba(255,255,255,.2)" fontFamily="DM Sans,sans-serif">NORTH BALI</text>
      <line x1="282" y1="33" x2="422" y2="33" stroke="rgba(255,255,255,.1)" strokeWidth=".5" />

      {/* Canggu */}
      <g className="pin-grp">
        <circle cx="155" cy="188" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '155px 188px', animationDelay: '0s' }} />
        <circle cx="155" cy="188" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '155px 188px', animationDelay: '1.4s' }} />
        <circle cx="155" cy="188" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="155" cy="188" r="2.2" fill="white" />
        <circle cx="155" cy="188" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="106" y="163" width="98" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="155" y="178" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Canggu</text>
        </g>
      </g>

      {/* Petitenget */}
      <g className="pin-grp">
        <circle cx="178" cy="197" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '178px 197px', animationDelay: '.35s' }} />
        <circle cx="178" cy="197" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '178px 197px', animationDelay: '1.75s' }} />
        <circle cx="178" cy="197" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="178" cy="197" r="2.2" fill="white" />
        <circle cx="178" cy="197" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="126" y="172" width="104" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="178" y="187" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Petitenget</text>
        </g>
      </g>

      {/* Seminyak (gold) */}
      <g className="pin-grp">
        <circle cx="202" cy="208" r="9" fill="rgba(201,148,76,.2)" className="pin-ring-anim" style={{ transformOrigin: '202px 208px', animationDelay: '.7s' }} />
        <circle cx="202" cy="208" r="9" fill="rgba(201,148,76,.1)" className="pin-ring-anim" style={{ transformOrigin: '202px 208px', animationDelay: '2.1s' }} />
        <circle cx="202" cy="208" r="6.5" fill="var(--gold)" filter="url(#pinGlow)" opacity=".96" />
        <circle cx="202" cy="208" r="2.8" fill="white" />
        <circle cx="202" cy="208" r="20" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="150" y="183" width="104" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(201,148,76,.32)" strokeWidth=".5" />
          <text x="202" y="198" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Seminyak ★</text>
        </g>
      </g>

      {/* Legian */}
      <g className="pin-grp">
        <circle cx="222" cy="219" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '222px 219px', animationDelay: '1.05s' }} />
        <circle cx="222" cy="219" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '222px 219px', animationDelay: '2.45s' }} />
        <circle cx="222" cy="219" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="222" cy="219" r="2.2" fill="white" />
        <circle cx="222" cy="219" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="178" y="194" width="88" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="222" y="209" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Legian</text>
        </g>
      </g>

      {/* Kuta */}
      <g className="pin-grp">
        <circle cx="245" cy="232" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '245px 232px', animationDelay: '1.4s' }} />
        <circle cx="245" cy="232" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '245px 232px', animationDelay: '2.8s' }} />
        <circle cx="245" cy="232" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="245" cy="232" r="2.2" fill="white" />
        <circle cx="245" cy="232" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="208" y="207" width="74" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="245" y="222" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Kuta</text>
        </g>
      </g>

      {/* Denpasar */}
      <g className="pin-grp">
        <circle cx="365" cy="220" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '365px 220px', animationDelay: '.2s' }} />
        <circle cx="365" cy="220" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '365px 220px', animationDelay: '1.6s' }} />
        <circle cx="365" cy="220" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="365" cy="220" r="2.2" fill="white" />
        <circle cx="365" cy="220" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="311" y="195" width="108" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="365" y="210" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Denpasar</text>
        </g>
      </g>

      {/* Sanur */}
      <g className="pin-grp">
        <circle cx="428" cy="242" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '428px 242px', animationDelay: '.55s' }} />
        <circle cx="428" cy="242" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '428px 242px', animationDelay: '1.95s' }} />
        <circle cx="428" cy="242" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="428" cy="242" r="2.2" fill="white" />
        <circle cx="428" cy="242" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="385" y="217" width="86" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="428" y="232" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Sanur</text>
        </g>
      </g>

      {/* Ubud (gold) */}
      <g className="pin-grp">
        <circle cx="418" cy="158" r="9" fill="rgba(201,148,76,.2)" className="pin-ring-anim" style={{ transformOrigin: '418px 158px', animationDelay: '.9s' }} />
        <circle cx="418" cy="158" r="9" fill="rgba(201,148,76,.1)" className="pin-ring-anim" style={{ transformOrigin: '418px 158px', animationDelay: '2.3s' }} />
        <circle cx="418" cy="158" r="6.5" fill="var(--gold)" filter="url(#pinGlow)" opacity=".96" />
        <circle cx="418" cy="158" r="2.8" fill="white" />
        <circle cx="418" cy="158" r="20" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="374" y="133" width="88" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(201,148,76,.32)" strokeWidth=".5" />
          <text x="418" y="148" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Ubud ★</text>
        </g>
      </g>

      {/* Jimbaran */}
      <g className="pin-grp">
        <circle cx="285" cy="290" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '285px 290px', animationDelay: '1.25s' }} />
        <circle cx="285" cy="290" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '285px 290px', animationDelay: '2.65s' }} />
        <circle cx="285" cy="290" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="285" cy="290" r="2.2" fill="white" />
        <circle cx="285" cy="290" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="233" y="265" width="104" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="285" y="280" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Jimbaran</text>
        </g>
      </g>

      {/* Bukit Peninsula */}
      <g className="pin-grp">
        <circle cx="318" cy="318" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '318px 318px', animationDelay: '1.6s' }} />
        <circle cx="318" cy="318" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '318px 318px', animationDelay: '3s' }} />
        <circle cx="318" cy="318" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="318" cy="318" r="2.2" fill="white" />
        <circle cx="318" cy="318" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="260" y="293" width="116" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="318" y="308" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Bukit Peninsula</text>
        </g>
      </g>

      {/* Nusa Dua (gold) */}
      <g className="pin-grp">
        <circle cx="375" cy="332" r="9" fill="rgba(201,148,76,.2)" className="pin-ring-anim" style={{ transformOrigin: '375px 332px', animationDelay: '.45s' }} />
        <circle cx="375" cy="332" r="9" fill="rgba(201,148,76,.1)" className="pin-ring-anim" style={{ transformOrigin: '375px 332px', animationDelay: '1.85s' }} />
        <circle cx="375" cy="332" r="6.5" fill="var(--gold)" filter="url(#pinGlow)" opacity=".96" />
        <circle cx="375" cy="332" r="2.8" fill="white" />
        <circle cx="375" cy="332" r="20" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="320" y="307" width="110" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(201,148,76,.32)" strokeWidth=".5" />
          <text x="375" y="322" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Nusa Dua ★</text>
        </g>
      </g>

      {/* Uluwatu */}
      <g className="pin-grp">
        <circle cx="312" cy="360" r="8" fill="rgba(142,191,191,.14)" className="pin-ring-anim" style={{ transformOrigin: '312px 360px', animationDelay: '2s' }} />
        <circle cx="312" cy="360" r="8" fill="rgba(142,191,191,.08)" className="pin-ring-anim" style={{ transformOrigin: '312px 360px', animationDelay: '3.4s' }} />
        <circle cx="312" cy="360" r="5.2" fill="var(--soft-aqua)" filter="url(#pinGlow)" opacity=".92" />
        <circle cx="312" cy="360" r="2.2" fill="white" />
        <circle cx="312" cy="360" r="18" fill="transparent" />
        <g className="pin-label-grp">
          <rect x="265" y="335" width="94" height="22" rx="5" fill="rgba(10,38,38,.96)" stroke="rgba(142,191,191,.22)" strokeWidth=".5" />
          <text x="312" y="350" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="white" fontFamily="DM Sans,sans-serif">Uluwatu</text>
        </g>
      </g>

      {/* Compass rose */}
      <g transform="translate(654,388)" opacity=".35">
        <circle cx="0" cy="0" r="16" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1" />
        <path d="M0,-12 L2.5,-4 L0,3 L-2.5,-4 Z" fill="rgba(255,255,255,.62)" />
        <path d="M0,12 L2.5,4 L0,-3 L-2.5,4 Z" fill="rgba(255,255,255,.2)" />
        <path d="M-12,0 L-4,2.5 L3,0 L-4,-2.5 Z" fill="rgba(255,255,255,.32)" />
        <path d="M12,0 L4,2.5 L-3,0 L4,-2.5 Z" fill="rgba(255,255,255,.15)" />
        <text x="0" y="3.5" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,.7)" fontFamily="DM Sans,sans-serif" fontWeight="700">N</text>
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    { text: 'Pelayanannya sangat cepat dan profesional. Tim datang ke villa kami dalam 45 menit. Setelah treatment, langsung bisa jalan-jalan lagi! Sangat recommended.', name: 'Sarah Johnson', loc: 'Villa di Seminyak', initial: 'S', tag: 'Hangover Recovery' },
    { text: "Tried the Hangover Recovery after a night in Canggu. Genuinely felt better within 2 hours. Equipment was clean and the team was super professional. Worth every rupiah!", name: 'James Miller', loc: 'Hotel di Canggu', initial: 'J', tag: 'Hangover Recovery' },
    { text: 'Tim medisnya sangat ramah dan peralatan terlihat steril dan berkualitas tinggi. Harga worth it banget untuk kualitas yang diberikan. Pasti akan repeat!', name: 'Maria Santos', loc: 'Airbnb di Ubud', initial: 'M', tag: 'Immune Booster' },
  ];

  return (
    <section className="sec testi-sec">
      <div className="sec-inner">
        <div className="sec-hdr centered reveal">
          <div className="sec-eyebrow">Testimonials</div>
          <h2 className="sec-title">Kata <em>Mereka</em></h2>
          <p className="sec-desc">Lebih dari 500 tamu Bali telah merasakan manfaat IV therapy kami.</p>
        </div>
        <div className="testi-grid">
          {testimonials.map((t, i) => (
            <div key={t.name} className="testi-card reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="testi-open">&ldquo;</div>
              <div className="testi-stars">{Array.from({ length: 5 }).map((_, j) => <span key={j}>★</span>)}</div>
              <p className="testi-text">{t.text}</p>
              <div className="testi-author">
                <div className="testi-av">{t.initial}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-loc">{t.loc}</div>
                </div>
                <span className="testi-tag">{t.tag}</span>
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
function CtaSection() {
  return (
    <section className="cta-sec">
      <div className="cta-inner reveal">
        <div className="cta-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Tersedia 08.00 – 22.00 WITA
        </div>
        <h2 className="cta-title">Ready to Feel <em>Better?</em></h2>
        <p className="cta-sub">Jangan biarkan dehidrasi atau kelelahan merusak liburan Bali-mu. Tim medis profesional kami siap datang ke tempat kamu berada.</p>
        <div className="cta-btns">
          <a href={waUrl('Halo DRIP TO YOU Bali, saya ingin booking treatment IV therapy')} className="btn-cta-wa" target="_blank" rel="noopener noreferrer">
            {WA_SVG}
            Booking via WhatsApp
          </a>
          <a href="#treatments" className="btn-cta-ghost">Lihat Semua Treatment</a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function SiteFooter() {
  return (
    <footer className="footer" id="contact-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div id="about-footer">
            <div className="footer-brand-logo">
              <div className="hdr-logo-text" style={{ fontSize: 17 }}>
                DRIP TO YOU<small>Bali — Mobile IV Therapy</small>
              </div>
            </div>
            <p className="footer-brand-desc">Mobile IV Therapy premium yang datang langsung ke villa, hotel, atau Airbnb kamu di seluruh Bali.</p>
            <a href={`https://wa.me/${WA_NUMBER}`} className="footer-brand-wa" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              +62 812-0000-0000
            </a>
          </div>

          <div>
            <div className="footer-col-title">Treatments</div>
            <div className="footer-links">
              <Link href="/treatments/hangover-recovery">Hangover Recovery</Link>
              <Link href="/treatments/immune-booster">Immune Booster</Link>
              <Link href="/treatments/energy-boost">Energy Boost</Link>
              <Link href="/treatments/beauty-glow">Beauty Glow</Link>
              <Link href="/treatments">Lihat Semua →</Link>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Info</div>
            <div className="footer-links">
              <Link href="/about">Tentang Kami</Link>
              <a href="#how-to-book">Cara Booking</a>
              <Link href="/faq">FAQ</Link>
              <Link href="/legal/terms-conditions">Terms &amp; Conditions</Link>
              <Link href="/legal/privacy-policy">Privacy Policy</Link>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Kontak</div>
            <div className="footer-contact">
              <div className="fcon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                +62 812-0000-0000
              </div>
              <div className="fcon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                hello@dripstoyou.com
              </div>
              <div className="fcon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                @driptoyoubali
              </div>
              <div className="fcon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                08:00 – 22:00 WITA
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} DRIP TO YOU Bali. All rights reserved. Mobile IV Therapy Premium di Bali.</p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
              </svg>
            </a>
            <a href={`https://wa.me/${WA_NUMBER}`} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.57 1.38 5.06L2 22l5.09-1.34A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
