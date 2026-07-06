'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language';

const ARROW_SVG = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

function sectionHref(section: string, pathname: string): string {
  return pathname === '/' ? `#${section}` : `/#${section}`;
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();
  const mobileTabIndex = menuOpen ? 0 : -1;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
    document.body.style.overflow = '';
  }
  function toggleMenu() {
    const next = !menuOpen;
    setMenuOpen(next);
    document.body.style.overflow = next ? 'hidden' : '';
  }

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <header className={`hdr${pathname === '/' ? ' hdr-home' : ''}${scrolled ? ' scrolled' : ''}`} id="hdr">
        <Link href="/" className="hdr-logo" aria-label="Drips To You - Bali — Home">
          <span className="hdr-logo-img-wrap">
            <Image
              src="/img/drips-to-you-bali-icon.webp"
              alt=""
              width={44}
              height={44}
              className="hdr-logo-img"
              priority
            />
          </span>
          <div className="hdr-logo-text">
            Drips To You - Bali
            <small>Mobile IV Therapy</small>
          </div>
        </Link>

        <nav className="hdr-nav" aria-label="Main navigation">
          <a href={sectionHref('treatments', pathname)}>{t.nav.treatments}</a>
          <a href={sectionHref('how-to-book', pathname)}>{t.nav.howToBook}</a>
          <a href={sectionHref('areas', pathname)}>{t.nav.coverage}</a>
          <Link href="/about" className={isActive('/about') ? 'nav-active' : ''}>{t.nav.about}</Link>
          <Link href="/contact" className={isActive('/contact') ? 'nav-active' : ''}>{t.nav.contact}</Link>
        </nav>

        <div className="hdr-right">
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="lang-toggle"
            aria-label="Switch language"
            title={lang === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'}
          >
            <span className={lang === 'id' ? 'lang-active' : ''}>ID</span>
            <span className="lang-sep">|</span>
            <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
          </button>

          <Link href="/booking" className="btn-hdr-book">
            {t.nav.bookNow}
            {ARROW_SVG}
          </Link>

          <button
            className={`hdr-hamburger${menuOpen ? ' open' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav
        className={`mob-menu${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
        aria-label="Mobile navigation"
      >
        <a href={sectionHref('treatments', pathname)} onClick={closeMenu} tabIndex={mobileTabIndex}>{t.nav.treatments}</a>
        <a href={sectionHref('how-to-book', pathname)} onClick={closeMenu} tabIndex={mobileTabIndex}>{t.nav.howToBook}</a>
        <a href={sectionHref('areas', pathname)} onClick={closeMenu} tabIndex={mobileTabIndex}>{t.nav.coverage}</a>
        <Link href="/about" onClick={closeMenu} tabIndex={mobileTabIndex}>{t.nav.about}</Link>
        <Link href="/contact" onClick={closeMenu} tabIndex={mobileTabIndex}>{t.nav.contact}</Link>

        <div className="mob-lang-row">
          <button
            onClick={() => { setLang('id'); closeMenu(); }}
            className={`mob-lang-btn${lang === 'id' ? ' active' : ''}`}
            tabIndex={mobileTabIndex}
          >
            🇮🇩 Indonesia
          </button>
          <button
            onClick={() => { setLang('en'); closeMenu(); }}
            className={`mob-lang-btn${lang === 'en' ? ' active' : ''}`}
            tabIndex={mobileTabIndex}
          >
            🇬🇧 English
          </button>
        </div>

        <Link href="/booking" className="mob-book-btn" onClick={closeMenu} tabIndex={mobileTabIndex}>
          {t.nav.bookNow}
        </Link>
      </nav>
    </>
  );
}
