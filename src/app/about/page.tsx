import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import { waGeneralUrl } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Tentang Kami - Drips To You - Bali | Mobile IV Therapy',
  description: 'Drips To You - Bali adalah layanan IV therapy on-call profesional yang hadir langsung ke villa, hotel, atau tempat menginap Anda di Bali.',
};

const VALUES = [
  {
    label: 'Medis',
    title: 'Tenaga Medis Profesional',
    desc: 'Treatment dilakukan oleh perawat dan dokter berlisensi dengan pengalaman klinis.',
  },
  {
    label: 'On-call',
    title: 'Datang ke Lokasi',
    desc: 'Tim datang ke villa, hotel, Airbnb, atau rumah di area utama Bali.',
  },
  {
    label: 'Steril',
    title: 'Peralatan Sekali Pakai',
    desc: 'Semua alat treatment disiapkan steril dan mengikuti standar medis.',
  },
  {
    label: 'Cepat',
    title: 'Respons 30-60 Menit',
    desc: 'Jadwal dikonfirmasi via WhatsApp dan tim bergerak sesuai area layanan.',
  },
];

const AREAS = [
  'Seminyak', 'Canggu', 'Kuta', 'Ubud', 'Nusa Dua', 'Jimbaran',
  'Legian', 'Sanur', 'Denpasar', 'Uluwatu', 'Petitenget', 'Bukit Peninsula',
];

const PROCESS_STEPS = [
  { num: '01', title: 'Pilih Treatment', desc: 'Pilih treatment sesuai kebutuhan dari website atau tanyakan via WhatsApp.' },
  { num: '02', title: 'Isi Form Booking', desc: 'Lengkapi data diri, tanggal, waktu, dan lokasi Anda.' },
  { num: '03', title: 'Konfirmasi WhatsApp', desc: 'Tim kami menghubungi Anda untuk konfirmasi jadwal dan detail.' },
  { num: '04', title: 'Tim Datang ke Lokasi', desc: 'Tenaga medis hadir ke lokasi Anda dalam waktu yang disepakati.' },
  { num: '05', title: 'Treatment Selesai', desc: 'Nikmati treatment dalam kenyamanan tempat Anda. Aman dan profesional.' },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        {/* Hero */}
        <section className="page-hero centered">
          <div className="page-hero-inner">
            <div className="page-eyebrow">Tentang Kami</div>
            <h1 className="page-title">
              Kesehatan di <em>Ujung Jari</em> Anda
            </h1>
            <p className="page-subtitle">
              Drips To You - Bali membantu tamu dan warga Bali mendapatkan IV therapy tanpa meninggalkan kenyamanan tempat menginap.
            </p>
            <div className="page-actions" style={{ justifyContent: 'center', marginTop: 28 }}>
              <Link href="/booking" className="button button-gold">
                Booking Sekarang
              </Link>
              <a
                className="button button-ghost-dark"
                href={waGeneralUrl('Halo, saya ingin tahu lebih lanjut tentang Drips To You Bali')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="page-section narrow">
          {/* Mission */}
          <div className="content-card">
            <h2>Misi Kami</h2>
            <p>
              Kami percaya perawatan kesehatan premium harus mudah diakses. Dengan menghadirkan tenaga medis langsung ke villa, hotel, Airbnb, atau rumah Anda, proses pemulihan menjadi lebih praktis dan nyaman.
            </p>
            <p style={{ marginTop: 14 }}>
              Setiap sesi IV therapy dilakukan oleh tenaga medis terlisensi dengan peralatan steril berstandar medis. Keselamatan, kebersihan, dan komunikasi yang jelas menjadi prioritas utama.
            </p>
          </div>

          {/* Values */}
          <div className="responsive-grid" style={{ marginTop: 22 }}>
            {VALUES.map((value) => (
              <article className="surface-card" key={value.title}>
                <span className="soft-tag" style={{ marginBottom: 16 }}>{value.label}</span>
                <h2>{value.title}</h2>
                <p>{value.desc}</p>
              </article>
            ))}
          </div>

          {/* Process */}
          <div className="content-card" style={{ marginTop: 22 }}>
            <h2>Cara Kerja Layanan</h2>
            <p style={{ marginBottom: 24, color: 'var(--ocean)' }}>Dari booking hingga treatment selesai — mudah dan aman.</p>
            <div style={{ display: 'grid', gap: 16 }}>
              {PROCESS_STEPS.map((step) => (
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

          {/* Safety note */}
          <div className="content-card" style={{ marginTop: 22, background: 'var(--pale-aqua)', border: '1px solid var(--soft-aqua)' }}>
            <h2 style={{ color: 'var(--teal)' }}>Keamanan & Kenyamanan</h2>
            <p>
              Layanan kami dirancang untuk membantu mendukung pemulihan dan hidrasi tubuh. Bukan untuk kondisi darurat medis.
              Jika Anda mengalami kondisi darurat, segera hubungi layanan gawat darurat setempat.
            </p>
            <p style={{ marginTop: 12 }}>
              Setiap team member kami memiliki lisensi medis aktif. Peralatan sekali pakai dan steril digunakan pada setiap sesi.
            </p>
          </div>

          {/* Areas */}
          <div className="content-card" style={{ marginTop: 22 }}>
            <h2>Area Layanan</h2>
            <p>Kami melayani area wisata dan hunian utama di Bali.</p>
            <div className="tag-row" style={{ marginTop: 18 }}>
              {AREAS.map((area) => (
                <span className="soft-tag" key={area}>{area}</span>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/booking" className="button button-secondary">
                Cek Ketersediaan Area
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="page-hero centered" style={{ borderRadius: 'var(--r-card)', marginTop: 24, padding: '42px 24px' }}>
            <div className="page-hero-inner">
              <h2 className="page-title" style={{ fontSize: '2rem' }}>Siap Mencoba?</h2>
              <p className="page-subtitle">
                Tim medis kami siap hadir ke lokasi Anda di Bali. Booking sekarang atau konsultasikan kebutuhan Anda.
              </p>
              <div className="page-actions" style={{ justifyContent: 'center' }}>
                <Link href="/booking" className="button button-gold">
                  Booking Sekarang
                </Link>
                <a className="button button-wa" href={waGeneralUrl()} target="_blank" rel="noopener noreferrer">
                  Chat di WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
