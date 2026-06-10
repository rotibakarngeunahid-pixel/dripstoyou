'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import { useLanguage } from '@/contexts/language';

function IVDripIllustration() {
  return (
    <svg
      width="140"
      height="190"
      viewBox="0 0 140 190"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Hang hole */}
      <circle cx="70" cy="12" r="7" fill="none" stroke="#29808B" strokeWidth="2.5" />

      {/* IV bag body */}
      <rect x="18" y="20" width="104" height="88" rx="22"
        fill="#D6EAEA" stroke="#29808B" strokeWidth="2.5" />

      {/* Fluid fill (lower half of bag) */}
      <clipPath id="nf-bag">
        <rect x="18" y="20" width="104" height="88" rx="22" />
      </clipPath>
      <rect x="18" y="62" width="104" height="46" clipPath="url(#nf-bag)"
        fill="rgba(41,128,139,0.2)" />

      {/* Label on bag */}
      <rect x="34" y="30" width="72" height="30" rx="8"
        fill="white" fillOpacity="0.75" />
      <text x="70" y="43" textAnchor="middle"
        fill="#205251" fontSize="7.5" fontWeight="700"
        fontFamily="DM Sans, system-ui, sans-serif" letterSpacing="0.5">
        DRIPS TO YOU
      </text>
      <text x="70" y="53.5" textAnchor="middle"
        fill="#29808B" fontSize="5.5"
        fontFamily="DM Sans, system-ui, sans-serif" letterSpacing="0.3">
        IV THERAPY · BALI
      </text>

      {/* Texture dots on bag */}
      <circle cx="40" cy="82" r="4" fill="rgba(41,128,139,0.12)" />
      <circle cx="100" cy="78" r="5" fill="rgba(41,128,139,0.10)" />
      <circle cx="55" cy="90" r="3" fill="rgba(41,128,139,0.09)" />

      {/* Connector port */}
      <rect x="63" y="108" width="14" height="11" rx="4" fill="#29808B" />

      {/* Tube */}
      <line x1="70" y1="119" x2="70" y2="160"
        stroke="#8EBFBF" strokeWidth="4" strokeLinecap="round" />

      {/* Drip chamber */}
      <ellipse cx="70" cy="163" rx="13" ry="9"
        fill="#D6EAEA" stroke="#29808B" strokeWidth="2" />

      {/* Animated drop 1 */}
      <ellipse cx="70" cy="128" rx="3.5" ry="4.5" fill="#29808B" opacity="0">
        <animate attributeName="cy" values="128;152;155" dur="2.2s" begin="0s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.85;0" dur="2.2s" begin="0s" repeatCount="indefinite" />
      </ellipse>

      {/* Animated drop 2 */}
      <ellipse cx="70" cy="128" rx="3" ry="4" fill="#8EBFBF" opacity="0">
        <animate attributeName="cy" values="128;152;155" dur="2.2s" begin="0.75s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.75;0" dur="2.2s" begin="0.75s" repeatCount="indefinite" />
      </ellipse>

      {/* Animated drop 3 */}
      <ellipse cx="70" cy="128" rx="2.5" ry="3.5" fill="#9ABFC1" opacity="0">
        <animate attributeName="cy" values="128;152;155" dur="2.2s" begin="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.6;0" dur="2.2s" begin="1.5s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}

export default function NotFound() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const t = {
    eyebrow: 'Error 404',
    title:
      lang === 'id' ? 'Halaman Tidak Ditemukan' : 'Page Not Found',
    desc:
      lang === 'id'
        ? 'Sepertinya tetes IV ini tersesat dalam perjalanan ke Bali. Halaman yang Anda cari tidak ada atau telah dipindahkan.'
        : "It seems this IV drip got lost on the way to Bali. The page you're looking for doesn't exist or has been moved.",
    backHome:
      lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home',
    viewTreatments:
      lang === 'id' ? 'Lihat Treatment' : 'View Treatments',
  };

  return (
    <>
      <Header />

      <main
        style={{
          minHeight: '100vh',
          background: 'var(--off-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '96px 24px 80px',
        }}
      >
        {/* Orb — top right */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '6%',
            right: '-10%',
            width: 520,
            height: 520,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(214,234,234,0.75) 0%, transparent 68%)',
            pointerEvents: 'none',
          }}
        />

        {/* Orb — bottom left */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '3%',
            left: '-12%',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(142,191,191,0.32) 0%, transparent 68%)',
            pointerEvents: 'none',
          }}
        />

        {/* Gold accent ring — decorative */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 640,
            height: 640,
            borderRadius: '50%',
            border: '1px solid rgba(201,148,76,0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 440,
            height: 440,
            borderRadius: '50%',
            border: '1px solid rgba(32,82,81,0.07)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div
          style={{
            maxWidth: 600,
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.55s cubic-bezier(.22,.68,0,1.2), transform 0.55s cubic-bezier(.22,.68,0,1.2)',
          }}
        >
          {/* IV drip illustration */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 4,
              filter: 'drop-shadow(0 8px 24px rgba(32,82,81,0.12))',
            }}
          >
            <IVDripIllustration />
          </div>

          {/* 404 */}
          <div
            style={{
              fontFamily: 'var(--font-playfair, "Playfair Display", serif)',
              fontSize: 'clamp(76px, 19vw, 148px)',
              fontWeight: 700,
              color: 'var(--gold)',
              lineHeight: 0.88,
              letterSpacing: '-4px',
              marginBottom: 28,
              textShadow: '0 6px 32px rgba(201,148,76,0.22)',
            }}
          >
            404
          </div>

          {/* Eyebrow badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(41,128,139,0.09)',
                border: '1px solid rgba(41,128,139,0.18)',
                borderRadius: 100,
                padding: '5px 15px',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--ocean)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: 1.8,
                  color: 'var(--ocean)',
                  textTransform: 'uppercase',
                }}
              >
                {t.eyebrow}
              </span>
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-playfair, "Playfair Display", serif)',
              fontSize: 'clamp(26px, 5vw, 40px)',
              fontWeight: 700,
              color: 'var(--teal)',
              lineHeight: 1.25,
              marginBottom: 16,
            }}
          >
            {t.title}
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.8,
              color: 'var(--text-muted)',
              maxWidth: 440,
              margin: '0 auto 40px',
            }}
          >
            {t.desc}
          </p>

          {/* Divider */}
          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 2,
              background: 'linear-gradient(90deg, var(--gold), var(--champagne))',
              borderRadius: 2,
              margin: '0 auto 36px',
            }}
          />

          {/* CTAs */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--teal)',
                color: 'white',
                padding: '14px 30px',
                borderRadius: 'var(--r-btn)',
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: 0.2,
                boxShadow: '0 4px 20px rgba(32,82,81,0.28)',
              }}
            >
              ← {t.backHome}
            </Link>
            <Link
              href="/treatments"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                color: 'var(--teal)',
                border: '1.5px solid rgba(32,82,81,0.3)',
                padding: '14px 30px',
                borderRadius: 'var(--r-btn)',
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: 0.2,
              }}
            >
              {t.viewTreatments}
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
