'use client';

import Image from 'next/image';
import Link from 'next/link';
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

export default function TreatmentDetailContent({ product, waNumber }: Props) {
  const { t } = useLanguage();

  const waMessage = t.treatmentDetail.waMessage.replace('{name}', product.name);
  const waContactUrl = buildWhatsAppUrl(waNumber, waMessage);

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="page-hero-inner">
          <Link href="/treatments" className="icon-link" style={{ color: 'var(--soft-aqua)', marginBottom: 22 }}>
            {t.treatmentDetail.backAll}
          </Link>
          {product.label && (
            <div>
              <span className="status-pill" style={{ color: 'var(--champagne)', background: 'rgba(184,131,62,.18)' }}>
                {product.label}
              </span>
            </div>
          )}
          <h1 className="page-title" style={{ marginTop: product.label ? 16 : 0 }}>
            {product.name}
          </h1>
          <p className="page-subtitle">{product.short_description}</p>
          <div className="page-actions">
            <div className="price-text" style={{ color: 'var(--champagne)', fontSize: '1.75rem' }}>
              {formatPrice(product)}
            </div>
            {product.duration_minutes && (
              <span className="muted-small" style={{ color: 'rgba(255,255,255,.65)' }}>
                {t.treatmentDetail.durationText.replace('{n}', String(product.duration_minutes))}
              </span>
            )}
            <Link
              href={`/booking?treatment=${product.slug}`}
              className="button button-gold"
            >
              {t.treatmentDetail.orderBtn.replace('{name}', product.name)}
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
      </section>

      <section className="page-section narrow">
        {product.image_url && (
          <div className="product-media" style={{ height: 360, borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 24 }}>
            <Image
              src={product.image_url}
              alt={`${product.name} IV therapy`}
              fill
              sizes="(max-width: 900px) 100vw, 820px"
              className="card-photo"
              unoptimized
            />
          </div>
        )}

        <div className="two-col-grid" style={{ marginBottom: 24 }}>
          {product.benefits && product.benefits.length > 0 && (
            <div className="content-card">
              <h2>{t.treatmentDetail.benefitsTitle}</h2>
              <ul className="check-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                {product.benefits.map((benefit) => (
                  <li key={benefit.id}>{benefit.benefit_text}</li>
                ))}
              </ul>
            </div>
          )}

          {product.full_description && (
            <div className="content-card">
              <h2>{t.treatmentDetail.aboutTitle}</h2>
              <p style={{ whiteSpace: 'pre-wrap' }}>{product.full_description}</p>
            </div>
          )}
        </div>

        {product.faqs && product.faqs.length > 0 && (
          <div className="content-card">
            <h2>{t.treatmentDetail.faqTitle}</h2>
            <div style={{ display: 'grid', gap: 18 }}>
              {product.faqs.map((faq) => (
                <div key={faq.id} style={{ borderBottom: '1px solid #f0eee8', paddingBottom: 18 }}>
                  <h3 style={{ color: 'var(--teal)', fontSize: '1rem', marginBottom: 8 }}>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="page-hero centered" style={{ borderRadius: 'var(--r-card)', marginTop: 28, padding: '42px 24px' }}>
          <div className="page-hero-inner">
            <h2 className="page-title" style={{ fontSize: '2rem' }}>
              {t.treatmentDetail.ctaTitle.replace('{name}', product.name)}
            </h2>
            <p className="page-subtitle">
              {t.treatmentDetail.ctaSubtitle}
            </p>
            <div className="page-actions" style={{ justifyContent: 'center' }}>
              <Link
                href={`/booking?treatment=${product.slug}`}
                className="button button-gold"
              >
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
    </main>
  );
}
