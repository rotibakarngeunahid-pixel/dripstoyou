'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/language';

const WA_SVG = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface Props {
  waNumber: string;
  displayNumber: string;
}

type ProductLink = { id: string; name: string; slug: string };
type SocialLink = {
  id: string;
  platform: string;
  label: string;
  value: string;
  normalizedUrl: string;
};

function formatPhone(value: string) {
  if (value.startsWith('62')) return `+62 ${value.slice(2, 5)} ${value.slice(5, 9)} ${value.slice(9)}`.trim();
  return value;
}

export default function SiteFooterClient({ waNumber, displayNumber }: Props) {
  const { t } = useLanguage();
  const [activeWa, setActiveWa] = useState(waNumber);
  const [activeDisplay, setActiveDisplay] = useState(displayNumber);
  const [siteEmail, setSiteEmail] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [products, setProducts] = useState<ProductLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/public/settings', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/public/products', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/public/social-links', { cache: 'no-store' }).then((res) => res.json()),
    ]).then(([settingsJson, productsJson, socialJson]) => {
      if (!active) return;
      const nextWa = typeof settingsJson.data?.whatsappNumber === 'string'
        ? settingsJson.data.whatsappNumber
        : waNumber;
      setActiveWa(nextWa);
      setActiveDisplay(formatPhone(nextWa));
      setSiteEmail(typeof settingsJson.data?.siteEmail === 'string' ? settingsJson.data.siteEmail : '');
      setBusinessHours(typeof settingsJson.data?.businessHours === 'string' ? settingsJson.data.businessHours : '');
      setProducts(Array.isArray(productsJson.data) ? productsJson.data.slice(0, 4) : []);
      setSocialLinks(Array.isArray(socialJson.data) ? socialJson.data : []);
    }).catch(() => {
      // Keep server-provided contact values when the API is unavailable.
    });
    return () => { active = false; };
  }, [displayNumber, waNumber]);

  const instagram = socialLinks.find((link) => link.platform === 'INSTAGRAM');
  const tiktok = socialLinks.find((link) => link.platform === 'TIKTOK');
  const configuredEmail = socialLinks.find((link) => link.platform === 'EMAIL');
  const email = configuredEmail?.value || siteEmail;

  return (
    <>
      <footer className="footer" id="contact-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div id="about-footer">
              <div className="footer-brand-logo">
                <div className="hdr-logo-text" style={{ fontSize: 17 }}>
                  Drips To You - Bali<small>Mobile IV Therapy</small>
                </div>
              </div>
              <p className="footer-brand-desc">
                {t.footer.brandDesc}
              </p>
              <a
                href={`https://wa.me/${activeWa}`}
                className="footer-brand-wa"
                target="_blank"
                rel="noopener noreferrer"
              >
                {WA_SVG}
                {activeDisplay}
              </a>
            </div>

            <div>
              <div className="footer-col-title">{t.footer.colTreatments}</div>
              <div className="footer-links">
                {products.map((product) => (
                  <Link href={`/treatments/${product.slug}`} key={product.id}>{product.name}</Link>
                ))}
                <Link href="/treatments">{t.footer.seeAll}</Link>
              </div>
            </div>

            <div>
              <div className="footer-col-title">{t.footer.colInfo}</div>
              <div className="footer-links">
                <Link href="/about">{t.footer.about}</Link>
                <Link href="/#how-to-book">{t.footer.howToBook}</Link>
                <Link href="/faq">{t.footer.faq}</Link>
                <Link href="/legal/terms-conditions">{t.footer.termsConditions}</Link>
                <Link href="/legal/privacy-policy">{t.footer.privacyPolicy}</Link>
              </div>
            </div>

            <div>
              <div className="footer-col-title">{t.footer.colContact}</div>
              <div className="footer-contact">
                <div className="fcon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {activeDisplay}
                </div>
                {email && (
                  <a className="fcon" href={`mailto:${email}`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    {email}
                  </a>
                )}
                {instagram && (
                  <a className="fcon" href={instagram.normalizedUrl} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                    {instagram.value}
                  </a>
                )}
                <div className="fcon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {businessHours ? `${businessHours.replace('-', ' - ')} WITA` : t.footer.hours}
                </div>
              </div>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="footer-bottom">
            <p className="footer-copy">
              © {new Date().getFullYear()} Drips To You - Bali. {t.footer.copyright}
            </p>
            <div className="footer-social">
              {instagram && <a href={instagram.normalizedUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>}
              {tiktok && <a href={tiktok.normalizedUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
                </svg>
              </a>}
              <a
                href={`https://wa.me/${activeWa}`}
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.57 1.38 5.06L2 22l5.09-1.34A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={`https://wa.me/${activeWa}?text=${encodeURIComponent(t.footer.waFloatMessage)}`}
        className="wa-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat via WhatsApp"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </>
  );
}
