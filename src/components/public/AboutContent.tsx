'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface Props {
  waNumber: string;
  areas: { id: string; name: string }[];
}

export default function AboutContent({ waNumber, areas }: Props) {
  const { t } = useLanguage();

  const waAboutUrl = buildWhatsAppUrl(waNumber, t.aboutPage.waMessage);
  const waGeneralUrl = buildWhatsAppUrl(waNumber, t.footer.waFloatMessage);

  return (
    <main className="page-shell">
      <section className="page-hero centered">
        <div className="page-hero-inner">
          <div className="page-eyebrow">{t.aboutPage.eyebrow}</div>
          <h1 className="page-title">
            {t.aboutPage.title} <em>{t.aboutPage.titleEm}</em>
          </h1>
          <p className="page-subtitle">{t.aboutPage.subtitle}</p>
          <div className="page-actions" style={{ justifyContent: 'center', marginTop: 28 }}>
            <Link href="/booking" className="button button-gold">
              {t.aboutPage.bookNow}
            </Link>
            <a
              className="button button-ghost-dark"
              href={waAboutUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.aboutPage.chatWa}
            </a>
          </div>
        </div>
      </section>

      <section className="page-section narrow">
        <div className="content-card">
          <h2>{t.aboutPage.missionTitle}</h2>
          <p>{t.aboutPage.missionP1}</p>
          <p style={{ marginTop: 14 }}>{t.aboutPage.missionP2}</p>
        </div>

        <div className="responsive-grid" style={{ marginTop: 22 }}>
          {t.aboutPage.values.map((value) => (
            <article className="surface-card" key={value.title}>
              <span className="soft-tag" style={{ marginBottom: 16 }}>{value.label}</span>
              <h2>{value.title}</h2>
              <p>{value.desc}</p>
            </article>
          ))}
        </div>

        <div className="content-card" style={{ marginTop: 22 }}>
          <h2>{t.aboutPage.howItWorksTitle}</h2>
          <p style={{ marginBottom: 24, color: 'var(--ocean)' }}>{t.aboutPage.howItWorksSub}</p>
          <div style={{ display: 'grid', gap: 16 }}>
            {t.aboutPage.steps.map((step) => (
              <div key={step.num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: 40, height: 40, borderRadius: '50%',
                  background: 'var(--teal)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--teal)', marginBottom: 4 }}>{step.title}</div>
                  <p style={{ margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-card" style={{ marginTop: 22, background: 'var(--pale-aqua)', border: '1px solid var(--soft-aqua)' }}>
          <h2 style={{ color: 'var(--teal)' }}>{t.aboutPage.safetyTitle}</h2>
          <p>{t.aboutPage.safetyP1}</p>
          <p style={{ marginTop: 12 }}>{t.aboutPage.safetyP2}</p>
        </div>

        <div className="content-card" style={{ marginTop: 22 }}>
          <h2>{t.aboutPage.areasTitle}</h2>
          <p>{t.aboutPage.areasSub}</p>
          {areas.length > 0 ? (
            <>
              <div className="tag-row" style={{ marginTop: 18 }}>
                {areas.map((area) => (
                  <span className="soft-tag" key={area.id}>{area.name}</span>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link href="/booking" className="button button-secondary">
                  {t.aboutPage.checkAreaBtn}
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ marginTop: 18 }}>{t.aboutPage.areasEmpty}</div>
          )}
        </div>

        <div className="page-hero centered" style={{ borderRadius: 'var(--r-card)', marginTop: 24, padding: '42px 24px' }}>
          <div className="page-hero-inner">
            <h2 className="page-title" style={{ fontSize: '2rem' }}>{t.aboutPage.ctaTitle}</h2>
            <p className="page-subtitle">{t.aboutPage.ctaSub}</p>
            <div className="page-actions" style={{ justifyContent: 'center' }}>
              <Link href="/booking" className="button button-gold">
                {t.aboutPage.ctaBookBtn}
              </Link>
              <a className="button button-wa" href={waGeneralUrl} target="_blank" rel="noopener noreferrer">
                {t.aboutPage.ctaWaBtn}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
