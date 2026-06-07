import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Panduan Admin - Drips To You - Bali' };

type Step = { num: string; title: string; desc: string; detail?: string };
type Section = { id: string; title: string; icon: string; steps: Step[] };

const GUIDE_SECTIONS: Section[] = [
  {
    id: 'bookings',
    title: 'Mengelola Booking',
    icon: '📋',
    steps: [
      { num: '1', title: 'Buka menu Bookings', desc: 'Klik "Bookings" di navbar atas untuk melihat semua pemesanan.' },
      { num: '2', title: 'Klik detail booking', desc: 'Klik tombol "Detail" pada baris booking untuk melihat informasi lengkap.' },
      { num: '3', title: 'Ubah status booking', desc: 'Di halaman detail, pilih status baru (Pending → Confirmed → Completed) dan klik "Simpan".' },
      { num: '4', title: 'Export data', desc: 'Gunakan tombol "Export CSV" di halaman Bookings untuk mengunduh data. Hanya SUPER_ADMIN yang bisa export.' },
    ],
  },
  {
    id: 'products',
    title: 'Mengelola Produk & Treatment',
    icon: '💊',
    steps: [
      { num: '1', title: 'Buka menu Produk', desc: 'Klik "Produk" untuk melihat daftar treatment yang tersedia.' },
      { num: '2', title: 'Tambah produk baru', desc: 'Klik "+ Tambah Produk" di pojok kanan atas.' },
      { num: '3', title: 'Isi detail produk', desc: 'Isi nama, deskripsi, harga, durasi, dan centang "Aktif" agar muncul di website.' },
      { num: '4', title: 'Edit atau nonaktifkan', desc: 'Klik "Edit" untuk mengubah, atau toggle "Aktif/Nonaktif" untuk menyembunyikan dari publik.' },
    ],
  },
  {
    id: 'faq',
    title: 'Mengelola FAQ',
    icon: '❓',
    steps: [
      { num: '1', title: 'Buka menu FAQ', desc: 'Klik "FAQ" di navbar untuk mengelola pertanyaan umum.' },
      { num: '2', title: 'Tambah FAQ baru', desc: 'Klik "+ Tambah FAQ", pilih kategori, tulis pertanyaan dan jawaban lengkap.' },
      { num: '3', title: 'Atur urutan tampil', desc: 'Ubah angka "Urutan" — angka lebih kecil tampil lebih dulu.' },
      { num: '4', title: 'Aktif/nonaktif', desc: 'Klik tombol status di kolom Status untuk toggle tampil/sembunyikan dari publik.' },
    ],
  },
  {
    id: 'social',
    title: 'Mengelola Social Links',
    icon: '🔗',
    steps: [
      { num: '1', title: 'Buka menu Social', desc: 'Klik "Social" untuk mengelola link media sosial dan kontak.' },
      { num: '2', title: 'Tambah link baru', desc: 'Klik "+ Tambah Link", pilih platform (WhatsApp, Instagram, dll), isi label dan nilai.' },
      { num: '3', title: 'Untuk WhatsApp', desc: 'Masukkan nomor HP (contoh: 081234567890). Sistem otomatis mengubah ke format internasional.', detail: 'Contoh: 081234567890 → wa.me/6281234567890' },
      { num: '4', title: 'Untuk Instagram/TikTok', desc: 'Cukup masukkan username saja (contoh: @dripstoyou.bali). URL dibuat otomatis.' },
    ],
  },
  {
    id: 'coverage',
    title: 'Mengelola Area Layanan',
    icon: '📍',
    steps: [
      { num: '1', title: 'Buka menu Area', desc: 'Klik "Area" di navbar untuk mengelola daftar area yang dilayani.' },
      { num: '2', title: 'Tambah area baru', desc: 'Klik "+ Tambah Area", isi nama area dan slug (format: seminyak, nusa-dua).' },
      { num: '3', title: 'Isi estimasi dan biaya', desc: 'Isi estimasi tiba (menit) dan biaya tambahan jika ada (dalam Rupiah).' },
      { num: '4', title: 'Nonaktifkan area', desc: 'Klik "Nonaktifkan" untuk menyembunyikan area dari publik tanpa menghapus data.' },
    ],
  },
  {
    id: 'about',
    title: 'Mengedit Halaman About',
    icon: '🏢',
    steps: [
      { num: '1', title: 'Buka menu About', desc: 'Klik "About" di navbar untuk mengedit konten halaman Tentang Kami.' },
      { num: '2', title: 'Edit teks hero', desc: 'Ubah tagline dan paragraf yang muncul di bagian atas halaman About.' },
      { num: '3', title: 'Simpan', desc: 'Klik "Simpan Perubahan". Perubahan tersimpan ke database.' },
      { num: '4', title: 'Lihat halaman', desc: 'Klik "Lihat Halaman ↗" untuk memastikan tampilan di publik sudah benar.' },
    ],
  },
];

const TIPS = [
  { icon: '🔒', title: 'Keamanan', desc: 'Jangan bagikan password ke siapapun. Logout setelah selesai menggunakan admin.' },
  { icon: '📱', title: 'Nomor WA', desc: 'Selalu masukkan nomor WhatsApp tanpa +62 di depan. Cukup 08xxx. Sistem akan mengkonversi otomatis.' },
  { icon: '⚡', title: 'Perubahan Langsung', desc: 'Hampir semua perubahan (FAQ, Area, Social Links) langsung tampil di publik tanpa perlu refresh manual.' },
  { icon: '🏥', title: 'Konten Medis', desc: 'Hindari kata "menyembuhkan", "garansi", atau "pasti sembuh". Gunakan "membantu mendukung" atau "dirancang untuk".' },
];

export default function AdminGuidePage() {
  return (
    <div className="admin-page" style={{ maxWidth: 900 }}>
      <div className="admin-page-head" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="admin-title">Panduan Admin</h1>
          <p className="admin-subtitle">Panduan penggunaan CMS untuk tim non-teknis Drips To You Bali.</p>
        </div>
      </div>

      {/* Tips Penting */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {TIPS.map((tip) => (
          <div key={tip.icon} style={{ background: 'var(--pale-aqua)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{tip.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--teal)', marginBottom: 4 }}>{tip.title}</div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{tip.desc}</div>
          </div>
        ))}
      </div>

      {/* Section Guides */}
      {GUIDE_SECTIONS.map((section) => (
        <div key={section.id} className="form-card" style={{ marginBottom: 24 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, color: 'var(--teal)', marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>{section.icon}</span>
            {section.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {section.steps.map((step) => (
              <div key={step.num} style={{ display: 'flex', gap: 14 }}>
                <div style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--teal)', color: '#fff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14,
                }}>
                  {step.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', marginBottom: 2 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{step.desc}</div>
                  {step.detail && (
                    <div style={{ marginTop: 4, padding: '4px 10px', background: '#f0f9ff', borderLeft: '3px solid var(--ocean)', fontSize: 12, color: '#1e6f8c' }}>
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <div style={{ textAlign: 'center', padding: '24px 0', color: '#888', fontSize: 13 }}>
        Butuh bantuan? Hubungi tim teknis atau lihat dokumentasi di repository.
      </div>
    </div>
  );
}
