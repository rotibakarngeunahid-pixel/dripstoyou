'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/language';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface Benefit {
  id: string;
  benefit_text: string;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  price_amount: number;
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  label: string | null;
  benefits: Benefit[];
  faqs: Faq[];
}

interface Props {
  product: Product;
  waNumber: string;
}

function formatPrice(product: Product) {
  return product.price_label ?? `IDR ${product.price_amount.toLocaleString('id-ID')}`;
}

const HOW_IT_WORKS = {
  id: [
    { num: '01', title: 'Pilih & Pesan', desc: 'Klik tombol pesan dan isi form booking online dengan detail lokasi Anda.' },
    { num: '02', title: 'Konfirmasi', desc: 'Tim kami menghubungi Anda via WhatsApp untuk konfirmasi jadwal dan area.' },
    { num: '03', title: 'Tim Datang', desc: 'Tenaga medis berlisensi hadir ke lokasi Anda sesuai waktu yang disepakati.' },
    { num: '04', title: 'Selesai', desc: 'Nikmati treatment dalam kenyamanan tempat Anda. Aman dan profesional.' },
  ],
  en: [
    { num: '01', title: 'Book Online', desc: 'Click book and fill in the online form with your location details.' },
    { num: '02', title: 'Confirmation', desc: 'Our team contacts you via WhatsApp to confirm the schedule and area.' },
    { num: '03', title: 'Team Arrives', desc: 'Licensed medical staff arrive at your location at the agreed time.' },
    { num: '04', title: 'Done', desc: 'Enjoy the treatment in the comfort of your space. Safe and professional.' },
  ],
};

export default function TreatmentDetailContent({ product, waNumber }: Props) {
  const { t, lang } = useLanguage();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  const waMessage = t.treatmentDetail.waMessage.replace('{name}', product.name);
  const waContactUrl = buildWhatsAppUrl(waNumber, waMessage);
  const bookUrl = `/booking?treatment=${product.slug}`;
  const steps = HOW_IT_WORKS[lang] ?? HOW_IT_WORKS.en;
  const isId = lang === 'id';

  useEffect(() => {
    function onScroll() { setStickyVisible(window.scrollY > 420); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className="td-shell">

      {/* ── HERO: split layout ── */}
      <section className="td-hero">
        <div className="td-hero-inner">

          {/* Left: content */}
          <div className="td-hero-content">
            <Link href="/treatments" className="td-back-link">
              ← {isId ? 'Semua Treatment' : 'All Treatments'}
            </Link>
            {product.label && (
              <span className="td-badge">{product.label}</span>
            )}
            <h1 className="td-hero-title">{product.name}</h1>
            {product.short_description && (
              <p className="td-hero-sub">{product.short_description}</p>
            )}
            <div className="td-hero-meta">
              <span className="td-price">{formatPrice(product)}</span>
              {product.duration_minutes && (
                <span className="td-duration">
                  ⏱ {t.treatmentDetail.durationText.replace('{n}', String(product.duration_minutes))}
                </span>
              )}
            </div>
            <div className="td-hero-cta">
              <Link href={bookUrl} className="button button-gold">
                {isId ? 'Pesan Sekarang' : 'Book Now'}
              </Link>
              <a
                href={waContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-ghost-dark"
              >
                {t.treatmentDetail.askWa}
              </a>
            </div>
          </div>

          {/* Right: image */}
          <div className="td-hero-photo">
            {product.image_url ? (
              <div className="td-hero-photo-wrap">
                <Image
                  src={product.image_url}
                  alt={`${product.name} IV therapy`}
                  fill
                  sizes="(max-width: 900px) 100vw, 44vw"
                  className="td-hero-img"
                  unoptimized
                  priority
                />
              </div>
            ) : (
              <div className="td-hero-photo-placeholder" />
            )}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      {product.benefits && product.benefits.length > 0 && (
        <section className="td-section td-benefits-section">
          <div className="td-section-inner">
            <div className="td-sec-label">{t.treatmentDetail.benefitsTitle}</div>
            <div className="td-benefits-grid">
              {product.benefits.map((b, i) => (
                <div
                  key={b.id}
                  className="td-benefit-card reveal"
                  style={{ transitionDelay: `${i * 0.06}s` }}
                >
                  <div className="td-benefit-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>{b.benefit_text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT / FULL DESCRIPTION ── */}
      {product.full_description && (
        <section className="td-section td-about-section">
          <div className="td-section-inner td-about-grid">
            <div className="reveal">
              <div className="td-sec-eyebrow">
                {isId ? 'Detail Treatment' : 'Treatment Details'}
              </div>
              <h2 className="td-sec-title">{t.treatmentDetail.aboutTitle}</h2>
              <p className="td-about-text">{product.full_description}</p>
            </div>
            {product.image_url && (
              <div className="td-about-img-wrap reveal">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="td-about-img"
                  unoptimized
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="td-section td-how-section">
        <div className="td-section-inner">
          <div className="td-sec-eyebrow">
            {isId ? 'Cara Kerja' : 'How It Works'}
          </div>
          <h2 className="td-sec-title">
            {isId ? 'Dari Booking ke Treatment' : 'From Booking to Treatment'}
          </h2>
          <div className="td-steps-row">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="td-step reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="td-step-num">{step.num}</div>
                <div className="td-step-body">
                  <div className="td-step-title">{step.title}</div>
                  <div className="td-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {product.faqs && product.faqs.length > 0 && (
        <section className="td-section td-faq-section">
          <div className="td-section-inner">
            <div className="td-sec-label">{t.treatmentDetail.faqTitle}</div>
            <h2 className="td-sec-title">
              {isId ? 'Pertanyaan yang Sering Ditanyakan' : 'Frequently Asked Questions'}
            </h2>
            <div className="td-faq-list">
              {product.faqs.map((faq) => (
                <div key={faq.id} className={`td-faq-item${openFaq === faq.id ? ' open' : ''}`}>
                  <button
                    className="td-faq-q"
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    aria-expanded={openFaq === faq.id}
                  >
                    <span>{faq.question}</span>
                    <svg
                      className="td-faq-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div className="td-faq-a">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA BOTTOM ── */}
      <section className="td-cta-section">
        <div className="td-section-inner">
          <div className="td-cta-inner reveal">
            <div className="td-cta-text">
              <h2 className="td-cta-title">
                {t.treatmentDetail.ctaTitle.replace('{name}', product.name)}
              </h2>
              <p className="td-cta-sub">{t.treatmentDetail.ctaSubtitle}</p>
            </div>
            <div className="td-cta-actions">
              <Link href={bookUrl} className="button button-gold">
                {t.treatmentDetail.bookBtn.replace('{name}', product.name)}
              </Link>
              <a
                href={waContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-ghost-dark"
              >
                {t.treatmentDetail.askWaFirst}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE STICKY CTA (only on mobile) ── */}
      <div className={`td-sticky-cta${stickyVisible ? ' visible' : ''}`} aria-hidden={!stickyVisible}>
        <div className="td-sticky-price">
          <span className="td-sticky-name">{product.name}</span>
          <span className="td-sticky-amount">{formatPrice(product)}</span>
        </div>
        <div className="td-sticky-btns">
          <Link href={bookUrl} className="td-sticky-book">
            {isId ? 'Pesan Sekarang' : 'Book Now'}
          </Link>
          <a
            href={waContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="td-sticky-wa"
            aria-label="Chat via WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="white" width="20" height="20" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      </div>

    </main>
  );
}
