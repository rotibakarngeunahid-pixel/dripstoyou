import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import { waGeneralUrl } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FAQ - Drips To You - Bali | Pertanyaan Umum',
  description: 'Jawaban atas pertanyaan umum seputar layanan IV therapy on-call Drips To You - Bali.',
};

interface Faq {
  id: string;
  question: string;
  answer: string;
}

async function getFaqs(): Promise<Faq[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/faqs.php`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero centered">
          <div className="page-hero-inner">
            <div className="page-eyebrow">FAQ</div>
            <h1 className="page-title">Ada Pertanyaan?</h1>
            <p className="page-subtitle">
              Temukan jawaban tentang proses booking, keamanan treatment, area layanan, dan konfirmasi jadwal.
            </p>
          </div>
        </section>

        <section className="page-section narrow">
          {faqs.length > 0 ? (
            <div className="faq-list">
              {faqs.map((faq) => (
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
              FAQ akan segera tersedia.
            </div>
          )}

          <div className="content-card" style={{ textAlign: 'center', marginTop: 28 }}>
            <h2>Masih ada pertanyaan?</h2>
            <p>Tim kami siap membantu Anda melalui WhatsApp.</p>
            <div className="page-actions" style={{ justifyContent: 'center' }}>
              <a
                className="button button-wa"
                href={waGeneralUrl('Halo, saya punya pertanyaan tentang layanan Drips To You - Bali')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Tanya via WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
