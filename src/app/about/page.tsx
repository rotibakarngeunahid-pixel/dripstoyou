import type { Metadata } from 'next';
import Header from '@/components/public/Header';
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
  'Seminyak',
  'Canggu',
  'Kuta',
  'Ubud',
  'Nusa Dua',
  'Jimbaran',
  'Legian',
  'Sanur',
  'Denpasar',
  'Uluwatu',
  'Petitenget',
  'Bukit Peninsula',
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero centered">
          <div className="page-hero-inner">
            <div className="page-eyebrow">Tentang Kami</div>
            <h1 className="page-title">
              Kesehatan di <em>Ujung Jari</em> Anda
            </h1>
            <p className="page-subtitle">
              Drips To You - Bali membantu tamu dan warga Bali mendapatkan IV therapy tanpa meninggalkan kenyamanan tempat menginap.
            </p>
          </div>
        </section>

        <section className="page-section narrow">
          <div className="content-card">
            <h2>Misi Kami</h2>
            <p>
              Kami percaya perawatan kesehatan premium harus mudah diakses. Dengan menghadirkan tenaga medis langsung ke villa, hotel, Airbnb, atau rumah Anda, proses pemulihan menjadi lebih praktis dan nyaman.
            </p>
            <p style={{ marginTop: 14 }}>
              Setiap sesi IV therapy dilakukan oleh tenaga medis terlisensi dengan peralatan steril berstandar medis. Keselamatan, kebersihan, dan komunikasi yang jelas menjadi prioritas utama.
            </p>
          </div>

          <div className="responsive-grid" style={{ marginTop: 22 }}>
            {VALUES.map((value) => (
              <article className="surface-card" key={value.title}>
                <span className="soft-tag" style={{ marginBottom: 16 }}>{value.label}</span>
                <h2>{value.title}</h2>
                <p>{value.desc}</p>
              </article>
            ))}
          </div>

          <div className="content-card">
            <h2>Area Layanan</h2>
            <p>Kami melayani area wisata dan hunian utama di Bali.</p>
            <div className="tag-row" style={{ marginTop: 18 }}>
              {AREAS.map((area) => (
                <span className="soft-tag" key={area}>{area}</span>
              ))}
            </div>
          </div>

          <div className="page-hero centered" style={{ borderRadius: 'var(--r-card)', marginTop: 24, padding: '42px 24px' }}>
            <div className="page-hero-inner">
              <h2 className="page-title" style={{ fontSize: '2rem' }}>Hubungi Kami</h2>
              <p className="page-subtitle">
                Pertanyaan, konsultasi, atau booking dapat langsung dikirim ke tim kami via WhatsApp.
              </p>
              <div className="page-actions" style={{ justifyContent: 'center' }}>
                <a className="button button-wa" href={waGeneralUrl()} target="_blank" rel="noopener noreferrer">
                  Chat di WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
