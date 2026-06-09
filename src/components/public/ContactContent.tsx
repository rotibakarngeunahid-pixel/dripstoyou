'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface Props {
  waNumber: string;
}

export default function ContactContent({ waNumber }: Props) {
  const { t } = useLanguage();
  const waUrl = buildWhatsAppUrl(waNumber, t.footer.waFloatMessage);

  return (
    <main className="page-shell">
      {/* ── Hero ── */}
      <section className="page-hero centered contact-hero">
        {/* Large "IV" watermark — left background texture */}
        <span className="contact-hero-watermark" aria-hidden="true">IV</span>

        {/* Tropical leaf — top-right decoration */}
        <div className="contact-hero-leaf" aria-hidden="true">
          <svg viewBox="0 0 180 280" fill="none">
            <path d="M90 5C125 5 178 58 178 138C178 218 143 272 90 278C37 272 2 218 2 138C2 58 55 5 90 5Z" fill="#112b21"/>
            <path d="M46 108C46 86 64 73 80 80C67 88 60 103 62 124C64 145 78 158 78 158H47Z" fill="#0c2018"/>
            <path d="M134 94C148 102 155 122 152 143C149 164 137 176 137 176H111C125 165 136 147 133 125C130 103 118 93 118 93Z" fill="#0c2018"/>
            <path d="M90 12C90 12 88 148 90 274" stroke="#1e402f" strokeWidth="2.5" opacity="0.55"/>
            <path d="M90 60L42 100M90 110L36 158M90 165L44 210" stroke="#1e402f" strokeWidth="1.5" opacity="0.4"/>
            <path d="M90 60L138 100M90 110L144 158M90 165L136 210" stroke="#1e402f" strokeWidth="1.5" opacity="0.4"/>
          </svg>
        </div>

        {/* Hero text content */}
        <div className="page-hero-inner">
          <div className="contact-hero-eyebrow">
            <span className="contact-hero-eyebrow-text">{t.contactPage.eyebrow}</span>
            <div className="contact-hero-eyebrow-bar" />
          </div>
          <h1 className="page-title">{t.contactPage.title}</h1>
          <p className="page-subtitle">{t.contactPage.subtitle}</p>
        </div>
      </section>

      <section className="page-section narrow">
        {/* ── Two main CTA cards (equal height, button at bottom) ── */}
        <div className="responsive-grid" style={{ marginBottom: 20 }}>

          {/* WhatsApp card */}
          <article className="surface-card contact-cta-card">
            {/* Top row: text + illustration */}
            <div className="contact-cta-top">
              <div className="contact-cta-body">
                <span className="contact-tag contact-tag-wa">{t.contactPage.waTag}</span>
                <h2>{t.contactPage.waTitle}</h2>
                <p>{t.contactPage.waDesc}</p>
              </div>
              <div className="contact-cta-illo" aria-hidden="true">
                <svg width="110" height="130" viewBox="0 0 110 130" fill="none">
                  <ellipse cx="55" cy="75" rx="46" ry="46" fill="#d4f5e6" opacity="0.7"/>
                  <rect x="30" y="22" width="50" height="86" rx="10" fill="#b8ecd5" stroke="#9ABFC1" strokeWidth="1.5"/>
                  <rect x="35" y="32" width="40" height="60" rx="5" fill="white"/>
                  <circle cx="55" cy="98" r="5" fill="white" stroke="#9ABFC1" strokeWidth="1.5"/>
                  <rect x="45" y="25" width="20" height="3" rx="1.5" fill="#9ABFC1"/>
                  <circle cx="55" cy="62" r="14" fill="#25D366"/>
                  <path d="M63 52.5c-2.2-2.2-5.1-3.5-8.2-3.5-6.4 0-11.6 5.2-11.6 11.6 0 2 .5 4 1.6 5.8l-1.7 6.1 6.2-1.6c1.7.9 3.6 1.4 5.5 1.4 6.4 0 11.6-5.2 11.6-11.6 0-3.1-1.2-6-3.4-8.2zm-8.2 17.9c-1.7 0-3.4-.5-4.9-1.4l-.3-.2-3.6.9.9-3.5-.2-.4c-1-1.5-1.5-3.2-1.5-5 0-5.2 4.2-9.5 9.5-9.5 2.5 0 4.9 1 6.7 2.8 1.8 1.8 2.8 4.1 2.8 6.7-.1 5.2-4.3 9.6-9.4 9.6z" fill="white"/>
                </svg>
              </div>
            </div>
            {/* Button — always at bottom due to flex column + flex:1 on top row */}
            <a className="button button-wa full" href={waUrl} target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t.contactPage.waBtn}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </article>

          {/* Booking card */}
          <article className="surface-card contact-cta-card">
            <div className="contact-cta-top">
              <div className="contact-cta-body">
                <span className="contact-tag contact-tag-booking">{t.contactPage.bookingTag}</span>
                <h2>{t.contactPage.bookingTitle}</h2>
                <p>{t.contactPage.bookingDesc}</p>
              </div>
              <div className="contact-cta-illo" aria-hidden="true">
                <svg width="110" height="130" viewBox="0 0 110 130" fill="none">
                  <ellipse cx="55" cy="75" rx="46" ry="46" fill="#d6eaea" opacity="0.7"/>
                  <rect x="20" y="34" width="70" height="72" rx="10" fill="#e8f3f3" stroke="#9ABFC1" strokeWidth="1.5"/>
                  <rect x="20" y="34" width="70" height="26" rx="10" fill="#29808B"/>
                  <rect x="20" y="50" width="70" height="10" fill="#29808B"/>
                  <line x1="38" y1="27" x2="38" y2="42" stroke="#205251" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="72" y1="27" x2="72" y2="42" stroke="#205251" strokeWidth="2.5" strokeLinecap="round"/>
                  <text x="55" y="48" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="system-ui">BOOKING</text>
                  <circle cx="35" cy="76" r="5" fill="#D6EAEA"/>
                  <circle cx="55" cy="76" r="5" fill="#D6EAEA"/>
                  <circle cx="75" cy="76" r="5" fill="#D6EAEA"/>
                  <circle cx="35" cy="92" r="5" fill="#D6EAEA"/>
                  <circle cx="55" cy="92" r="7" fill="#205251"/>
                  <path d="M51.5 92l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="75" cy="92" r="5" fill="#D6EAEA"/>
                </svg>
              </div>
            </div>
            <Link className="button button-primary full" href="/booking">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {t.contactPage.bookingBtn}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </article>
        </div>

        {/* ── Service Hours ── */}
        <div className="content-card contact-hours-card">
          <div className="contact-hours-left">
            <div className="contact-hours-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h2>{t.contactPage.hoursTitle}</h2>
              <p>{t.contactPage.hoursDesc}</p>
            </div>
          </div>
          <div className="contact-hours-items">
            <div className="contact-hours-item">
              <div className="contact-hours-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </div>
              <div>
                <strong>{t.contactPage.hoursDaily}</strong>
                <span>{t.contactPage.hoursDailyTime}</span>
              </div>
            </div>
            <div className="contact-hours-item">
              <div className="contact-hours-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
              <div>
                <strong>{t.contactPage.hoursAfter}</strong>
                <span>{t.contactPage.hoursAfterDesc}</span>
              </div>
            </div>
            <div className="contact-hours-item">
              <div className="contact-hours-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <span className="contact-hours-licensed">{t.contactPage.hoursLicensed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Three info cards ── */}
        <div className="contact-info-grid">
          <div className="surface-card contact-info-card">
            <div className="contact-info-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 14"/>
              </svg>
            </div>
            <h3>{t.contactPage.responseTimeTitle}</h3>
            <p>{t.contactPage.responseTimeDesc}</p>
          </div>
          <div className="surface-card contact-info-card">
            <div className="contact-info-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h3>{t.contactPage.serviceAreaTitle}</h3>
            <p>{t.contactPage.serviceAreaDesc}</p>
          </div>
          <div className="surface-card contact-info-card">
            <div className="contact-info-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
            </div>
            <h3>{t.contactPage.urgentTitle}</h3>
            <p>{t.contactPage.urgentDesc}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
