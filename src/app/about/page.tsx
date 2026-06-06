import type { Metadata } from 'next';
import { waGeneralUrl } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Tentang Kami — Drips To You - Bali Bali | Mobile IV Therapy',
  description: 'Drips To You - Bali adalah layanan IV therapy on-call profesional yang hadir langsung ke villa, hotel, atau tempat menginap Anda di Bali.',
};

export default function AboutPage() {
  return (
    <main style={{ background: '#F3F0E7', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)', padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: '#8EBFBF', marginBottom: 16 }}>Tentang Kami</p>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: 'white', marginBottom: 16 }}>
          Kesehatan di <em>Ujung Jari</em> Anda
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: 'rgba(255,255,255,.7)', maxWidth: 560, margin: '0 auto' }}>
          Drips To You - Bali hadir untuk memastikan perjalanan Anda di Bali selalu menyenangkan — tanpa gangguan kesehatan yang tidak perlu.
        </p>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px' }}>
        {/* Mission */}
        <div style={{ background: 'white', borderRadius: 24, padding: '40px 36px', marginBottom: 28, boxShadow: '0 4px 24px rgba(32,82,81,0.08)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 24, fontWeight: 700, color: '#205251', marginBottom: 16 }}>Misi Kami</h2>
          <p style={{ color: '#4a5e5e', fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
            Kami percaya bahwa semua orang berhak mendapatkan perawatan kesehatan premium tanpa harus meninggalkan kenyamanan tempat mereka berada. Dengan menghadirkan tenaga medis berpengalaman langsung ke villa, hotel, atau Airbnb Anda, Drips To You - Bali menghilangkan hambatan antara Anda dan kesehatan optimal.
          </p>
          <p style={{ color: '#4a5e5e', fontSize: 15, lineHeight: 1.8 }}>
            Setiap sesi IV therapy dilakukan oleh tenaga medis terlisensi dengan peralatan steril berstandar medis. Kami tidak berkompromi dalam hal keselamatan dan kualitas.
          </p>
        </div>

        {/* Values */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>
          {[
            { icon: '🩺', title: 'Tenaga Medis Profesional', desc: 'Semua treatment dilakukan oleh perawat dan dokter berlisensi dengan pengalaman klinis.' },
            { icon: '🏨', title: 'Layanan On-Call', desc: 'Kami datang ke lokasi Anda — villa, hotel, Airbnb, atau rumah — di seluruh area utama Bali.' },
            { icon: '⚗️', title: 'Peralatan Steril', desc: 'Semua peralatan sekali pakai dan steril. Standar medis tertinggi untuk keamanan Anda.' },
            { icon: '⚡', title: 'Respons Cepat', desc: 'Tim kami rata-rata tiba dalam 30-60 menit setelah konfirmasi booking.' },
          ].map((v) => (
            <div key={v.title} style={{ background: 'white', borderRadius: 16, padding: '24px 20px', boxShadow: '0 2px 12px rgba(32,82,81,0.06)', border: '1px solid rgba(32,82,81,0.08)' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{v.icon}</div>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 700, color: '#205251', marginBottom: 8 }}>{v.title}</h3>
              <p style={{ color: '#6b7e7e', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Areas */}
        <div style={{ background: 'white', borderRadius: 24, padding: '40px 36px', marginBottom: 28, boxShadow: '0 4px 24px rgba(32,82,81,0.08)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 24, fontWeight: 700, color: '#205251', marginBottom: 16 }}>Area Layanan</h2>
          <p style={{ color: '#6b7e7e', fontSize: 14, marginBottom: 20 }}>Kami melayani seluruh area wisata utama Bali:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Seminyak', 'Canggu', 'Kuta', 'Ubud', 'Nusa Dua', 'Jimbaran', 'Legian', 'Sanur', 'Denpasar', 'Uluwatu', 'Petitenget', 'Bukit Peninsula'].map((area) => (
              <span key={area} style={{ background: '#f0f9f9', color: '#29808B', padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500, border: '1px solid #8EBFBF44' }}>
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, #0e2b2b 0%, #205251 100%)', borderRadius: 24, padding: '40px 32px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 12 }}>
            Hubungi Kami
          </h2>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, marginBottom: 24 }}>
            Pertanyaan, konsultasi, atau booking — tim kami siap membantu via WhatsApp.
          </p>
          <a
            href={waGeneralUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 32px', background: '#25D366', color: 'white', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Chat di WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
