import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import { waGeneralUrl } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Kontak - Drips To You - Bali',
  description: 'Hubungi Drips To You - Bali untuk konsultasi, pertanyaan, dan booking mobile IV therapy di Bali.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero centered">
          <div className="page-hero-inner">
            <div className="page-eyebrow">Kontak</div>
            <h1 className="page-title">Butuh Bantuan?</h1>
            <p className="page-subtitle">
              Tim kami siap membantu konsultasi treatment, pengecekan area layanan, dan konfirmasi booking.
            </p>
          </div>
        </section>

        <section className="page-section narrow">
          <div className="responsive-grid">
            <article className="surface-card">
              <span className="soft-tag" style={{ marginBottom: 16 }}>WhatsApp</span>
              <h2>Chat Langsung</h2>
              <p>Respons tercepat untuk konsultasi treatment dan pertanyaan umum.</p>
              <div className="page-actions">
                <a className="button button-wa full" href={waGeneralUrl()} target="_blank" rel="noopener noreferrer">
                  Chat via WhatsApp
                </a>
              </div>
            </article>

            <article className="surface-card">
              <span className="soft-tag" style={{ marginBottom: 16 }}>Booking</span>
              <h2>Form Website</h2>
              <p>Pilih treatment, tanggal, waktu, dan lokasi layanan untuk booking langsung.</p>
              <div className="page-actions">
                <Link className="button button-primary full" href="/booking">
                  Buka Form Booking
                </Link>
              </div>
            </article>
          </div>

          <div className="content-card">
            <h2>Jam Layanan</h2>
            <p>Setiap hari pukul 08:00 – 22:00 WITA. Estimasi kedatangan bergantung pada area layanan dan ketersediaan tim.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
