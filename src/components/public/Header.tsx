'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
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

  return (
    <>
      <header className={`hdr${scrolled ? ' scrolled' : ''}`} id="hdr">
        <Link href="/" className="hdr-logo" aria-label="Drips To You - Bali — Home">
          <div className="hdr-logo-text">
            Drips To You - Bali
            <small>Mobile IV Therapy</small>
          </div>
        </Link>

        <nav className="hdr-nav" aria-label="Main navigation">
          <a href="#treatments">{t.nav.treatments}</a>
          <a href="#how-to-book">{t.nav.howToBook}</a>
          <a href="#areas">{t.nav.coverage}</a>
          <Link href="/about">{t.nav.about}</Link>
          <Link href="/contact">{t.nav.contact}</Link>
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
        <a href="#treatments" onClick={closeMenu} tabIndex={mobileTabIndex}>{t.nav.treatments}</a>
        <a href="#how-to-book" onClick={closeMenu} tabIndex={mobileTabIndex}>{t.nav.howToBook}</a>
        <a href="#areas" onClick={closeMenu} tabIndex={mobileTabIndex}>{t.nav.coverage}</a>
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
