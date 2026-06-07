'use client';

import { useLanguage } from '@/contexts/language';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface Faq {
  id: string;
  questionEn: string;
  answerEn: string;
  questionId: string;
  answerId: string;
}

interface Props {
  faqs: Faq[];
  waNumber: string;
}

export default function FaqContent({ faqs, waNumber }: Props) {
  const { lang, t } = useLanguage();

  const waUrl = buildWhatsAppUrl(waNumber, t.faqPage.waMessage);
  const localizedFaqs = faqs
    .map((faq) => ({
      id: faq.id,
      question: lang === 'en' ? faq.questionEn : faq.questionId,
      answer: lang === 'en' ? faq.answerEn : faq.answerId,
    }))
    .filter((faq) => faq.question && faq.answer);

  return (
    <main className="page-shell">
      <section className="page-hero centered">
        <div className="page-hero-inner">
          <div className="page-eyebrow">{t.faqPage.eyebrow}</div>
          <h1 className="page-title">{t.faqPage.title}</h1>
          <p className="page-subtitle">{t.faqPage.subtitle}</p>
        </div>
      </section>

      <section className="page-section narrow">
        {localizedFaqs.length > 0 ? (
          <div className="faq-list">
            {localizedFaqs.map((faq) => (
              <details className="surface-card faq-item" key={faq.id}>
                <summary className="faq-summary">
                  {faq.question}
                  <span>+</span>
                </summary>
                <div className="faq-body">{faq.answer}</div>
              </details>
            ))}
          </div>
        ) : (
          <div className="empty-state surface-card">
            {t.faqPage.emptyState}
          </div>
        )}

        <div className="content-card" style={{ textAlign: 'center', marginTop: 28 }}>
          <h2>{t.faqPage.stillQ}</h2>
          <p>{t.faqPage.stillQDesc}</p>
          <div className="page-actions" style={{ justifyContent: 'center' }}>
            <a
              className="button button-wa"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.faqPage.askBtn}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
