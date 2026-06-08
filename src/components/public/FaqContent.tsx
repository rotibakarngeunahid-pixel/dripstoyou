'use client';

import { useLanguage } from '@/contexts/language';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

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
  const sourceTexts = faqs.flatMap((faq) => [
    faq.questionId || faq.questionEn,
    faq.answerId || faq.answerEn,
  ]);
  const { translated } = useAutoTranslate(sourceTexts, lang, 'public_faqs');

  const localizedFaqs = faqs
    .map((faq, idx) => {
      const translatedQuestion = translated[idx * 2] ?? '';
      const translatedAnswer = translated[idx * 2 + 1] ?? '';
      const storedQuestionEn = faq.questionEn && faq.questionEn !== faq.questionId ? faq.questionEn : '';
      const storedAnswerEn = faq.answerEn && faq.answerEn !== faq.answerId ? faq.answerEn : '';
      const storedQuestionId = faq.questionId && faq.questionId !== faq.questionEn ? faq.questionId : '';
      const storedAnswerId = faq.answerId && faq.answerId !== faq.answerEn ? faq.answerId : '';

      return {
        id: faq.id,
        question: lang === 'en'
          ? (storedQuestionEn || translatedQuestion || faq.questionId || faq.questionEn)
          : (storedQuestionId || translatedQuestion || faq.questionId || faq.questionEn),
        answer: lang === 'en'
          ? (storedAnswerEn || translatedAnswer || faq.answerId || faq.answerEn)
          : (storedAnswerId || translatedAnswer || faq.answerId || faq.answerEn),
      };
    })
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
