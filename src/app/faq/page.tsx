import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { waGeneralUrl } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FAQ — DRIP TO YOU Bali | Pertanyaan Umum',
  description: 'Jawaban atas pertanyaan umum seputar layanan IV therapy on-call DRIP TO YOU Bali.',
};

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <main style={{ background: '#F3F0E7', minHeight: '100vh' }}>
      <section style={{ background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)', padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: '#8EBFBF', marginBottom: 16 }}>Frequently Asked Questions</p>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: 'white', marginBottom: 16 }}>
          Ada Pertanyaan?
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: 'rgba(255,255,255,.7)', maxWidth: 480, margin: '0 auto' }}>
          Temukan jawaban dari pertanyaan yang sering ditanyakan tentang layanan kami.
        </p>
      </section>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {faqs.map((faq) => (
            <details key={faq.id} style={{ background: 'white', borderRadius: 16, padding: '0', boxShadow: '0 2px 12px rgba(32,82,81,0.06)', border: '1px solid rgba(32,82,81,0.08)', overflow: 'hidden' }}>
              <summary style={{ padding: '20px 24px', cursor: 'pointer', fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#205251', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {faq.question}
                <span style={{ color: '#29808B', fontSize: 20, flexShrink: 0, marginLeft: 16 }}>+</span>
              </summary>
              <div style={{ padding: '0 24px 20px', color: '#4a5e5e', fontSize: 14, lineHeight: 1.8 }}>
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        {faqs.length === 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: '#6b7e7e' }}>
            FAQ akan segera tersedia.
          </div>
        )}

        {/* Still have questions */}
        <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', marginTop: 40, textAlign: 'center', boxShadow: '0 4px 24px rgba(32,82,81,0.08)', border: '1px solid rgba(32,82,81,0.08)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#205251', marginBottom: 8 }}>
            Masih ada pertanyaan?
          </h2>
          <p style={{ color: '#6b7e7e', fontSize: 14, marginBottom: 20 }}>
            Tim kami siap membantu Anda melalui WhatsApp.
          </p>
          <a
            href={waGeneralUrl('Halo, saya punya pertanyaan tentang layanan DRIP TO YOU Bali')}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#25D366', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Tanya via WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
