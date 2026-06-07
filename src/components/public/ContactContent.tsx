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
      <section className="page-hero centered">
        <div className="page-hero-inner">
          <div className="page-eyebrow">{t.contactPage.eyebrow}</div>
          <h1 className="page-title">{t.contactPage.title}</h1>
          <p className="page-subtitle">{t.contactPage.subtitle}</p>
        </div>
      </section>

      <section className="page-section narrow">
        <div className="responsive-grid">
          <article className="surface-card">
            <span className="soft-tag" style={{ marginBottom: 16 }}>{t.contactPage.waTag}</span>
            <h2>{t.contactPage.waTitle}</h2>
            <p>{t.contactPage.waDesc}</p>
            <div className="page-actions">
              <a className="button button-wa full" href={waUrl} target="_blank" rel="noopener noreferrer">
                {t.contactPage.waBtn}
              </a>
            </div>
          </article>

          <article className="surface-card">
            <span className="soft-tag" style={{ marginBottom: 16 }}>{t.contactPage.bookingTag}</span>
            <h2>{t.contactPage.bookingTitle}</h2>
            <p>{t.contactPage.bookingDesc}</p>
            <div className="page-actions">
              <Link className="button button-primary full" href="/booking">
                {t.contactPage.bookingBtn}
              </Link>
            </div>
          </article>
        </div>

        <div className="content-card">
          <h2>{t.contactPage.hoursTitle}</h2>
          <p>{t.contactPage.hoursDesc}</p>
        </div>
      </section>
    </main>
  );
}
