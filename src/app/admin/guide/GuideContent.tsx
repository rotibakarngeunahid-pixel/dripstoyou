'use client';

import { useAdminLang } from '@/app/admin/AdminLayoutClient';

type Step = { num: string; title: string; desc: string; detail?: string };
type Section = { id: string; title: string; icon: string; steps: Step[] };
type Tip = { icon: string; title: string; desc: string };

const GUIDE_SECTIONS_ID: Section[] = [
  {
    id: 'bookings', title: 'Mengelola Booking', icon: '📋',
    steps: [
      { num: '1', title: 'Buka menu Bookings', desc: 'Klik "Bookings" di navbar atas untuk melihat semua pemesanan.' },
      { num: '2', title: 'Klik detail booking', desc: 'Klik tombol "Detail" pada baris booking untuk melihat informasi lengkap.' },
      { num: '3', title: 'Ubah status booking', desc: 'Di halaman detail, pilih status baru (Baru → Konfirmasi → Selesai) dan klik "Simpan Status".' },
      { num: '4', title: 'Export data', desc: 'Gunakan tombol "Export CSV" di halaman Bookings untuk mengunduh data. Hanya SUPER_ADMIN yang bisa export.' },
    ],
  },
  {
    id: 'products', title: 'Mengelola Produk & Treatment', icon: '💊',
    steps: [
      { num: '1', title: 'Buka menu Produk', desc: 'Klik "Produk" untuk melihat daftar treatment yang tersedia.' },
      { num: '2', title: 'Tambah produk baru', desc: 'Klik "Tambah Produk" di pojok kanan atas.' },
      { num: '3', title: 'Isi detail produk', desc: 'Isi nama, deskripsi, harga, durasi, dan centang "Aktif" agar muncul di website.' },
      { num: '4', title: 'Edit atau nonaktifkan', desc: 'Klik "Edit" untuk mengubah, atau toggle "Aktif/Nonaktif" untuk menyembunyikan dari publik.' },
    ],
  },
  {
    id: 'faq', title: 'Mengelola FAQ', icon: '❓',
    steps: [
      { num: '1', title: 'Buka menu FAQ', desc: 'Klik "FAQ" di navbar untuk mengelola pertanyaan umum.' },
      { num: '2', title: 'Tambah FAQ baru', desc: 'Klik "+ Tambah FAQ", tulis pertanyaan dan jawaban lengkap.' },
      { num: '3', title: 'Atur urutan tampil', desc: 'Ubah angka "Urutan" — angka lebih kecil tampil lebih dulu.' },
      { num: '4', title: 'Aktif/nonaktif', desc: 'Klik tombol status untuk toggle tampil/sembunyikan dari publik.' },
    ],
  },
  {
    id: 'social', title: 'Mengelola Social Links', icon: '🔗',
    steps: [
      { num: '1', title: 'Buka menu Social', desc: 'Klik "Social" untuk mengelola link media sosial dan kontak.' },
      { num: '2', title: 'Tambah link baru', desc: 'Klik "+ Tambah Link", pilih platform (WhatsApp, Instagram, dll), isi label dan nilai.' },
      { num: '3', title: 'Untuk WhatsApp', desc: 'Masukkan nomor HP (contoh: 081234567890). Sistem otomatis mengubah ke format internasional.', detail: 'Contoh: 081234567890 → wa.me/6281234567890' },
      { num: '4', title: 'Untuk Instagram/TikTok', desc: 'Cukup masukkan username saja (contoh: @dripstoyou.bali). URL dibuat otomatis.' },
    ],
  },
  {
    id: 'coverage', title: 'Mengelola Area Layanan', icon: '📍',
    steps: [
      { num: '1', title: 'Buka menu Area', desc: 'Klik "Area" di navbar untuk mengelola daftar area yang dilayani.' },
      { num: '2', title: 'Tambah area baru', desc: 'Klik "+ Tambah Area", isi nama area dan slug (format: seminyak, nusa-dua).' },
      { num: '3', title: 'Isi estimasi dan biaya', desc: 'Isi estimasi tiba (menit) dan biaya tambahan jika ada (dalam Rupiah).' },
      { num: '4', title: 'Nonaktifkan area', desc: 'Klik "Nonaktifkan" untuk menyembunyikan area dari publik tanpa menghapus data.' },
    ],
  },
  {
    id: 'settings', title: 'Pengaturan Situs', icon: '⚙️',
    steps: [
      { num: '1', title: 'Buka Pengaturan', desc: 'Klik "Settings" di sidebar untuk mengedit pengaturan situs.' },
      { num: '2', title: 'Nomor WhatsApp', desc: 'Isi nomor tanpa + atau spasi. Contoh: 6281234567890.' },
      { num: '3', title: 'Jam Operasional', desc: 'Atur jam buka dan tutup per hari. Toggle "Tutup" untuk hari libur.' },
      { num: '4', title: 'Simpan', desc: 'Klik "Simpan Pengaturan". Perubahan langsung aktif.' },
    ],
  },
];

const GUIDE_SECTIONS_EN: Section[] = [
  {
    id: 'bookings', title: 'Managing Bookings', icon: '📋',
    steps: [
      { num: '1', title: 'Open Bookings menu', desc: 'Click "Bookings" in the top navbar to see all reservations.' },
      { num: '2', title: 'View booking detail', desc: 'Click the "Detail" button on a booking row to see full information.' },
      { num: '3', title: 'Change booking status', desc: 'On the detail page, select a new status (New → Confirmed → Completed) and click "Save Status".' },
      { num: '4', title: 'Export data', desc: 'Use the "Export CSV" button on the Bookings page to download data. Only SUPER_ADMIN can export.' },
    ],
  },
  {
    id: 'products', title: 'Managing Products & Treatments', icon: '💊',
    steps: [
      { num: '1', title: 'Open Products menu', desc: 'Click "Products" to see the list of available treatments.' },
      { num: '2', title: 'Add a new product', desc: 'Click "Add Product" in the top right corner.' },
      { num: '3', title: 'Fill product details', desc: 'Enter name, description, price, duration, and check "Active" to show it on the website.' },
      { num: '4', title: 'Edit or deactivate', desc: 'Click "Edit" to modify, or toggle "Active/Inactive" to hide from public.' },
    ],
  },
  {
    id: 'faq', title: 'Managing FAQs', icon: '❓',
    steps: [
      { num: '1', title: 'Open FAQ menu', desc: 'Click "FAQ" in the navbar to manage frequently asked questions.' },
      { num: '2', title: 'Add a new FAQ', desc: 'Click "+ Add FAQ", write the question and full answer.' },
      { num: '3', title: 'Set display order', desc: 'Change the "Order" number — smaller numbers appear first.' },
      { num: '4', title: 'Active / inactive', desc: 'Click the status button to toggle show/hide from public.' },
    ],
  },
  {
    id: 'social', title: 'Managing Social Links', icon: '🔗',
    steps: [
      { num: '1', title: 'Open Social menu', desc: 'Click "Social" to manage social media and contact links.' },
      { num: '2', title: 'Add a new link', desc: 'Click "+ Add Link", select platform (WhatsApp, Instagram, etc.), fill in label and value.' },
      { num: '3', title: 'For WhatsApp', desc: 'Enter phone number (e.g. 081234567890). System automatically converts to international format.', detail: 'Example: 081234567890 → wa.me/6281234567890' },
      { num: '4', title: 'For Instagram / TikTok', desc: 'Just enter username (e.g. @dripstoyou.bali). URL is generated automatically.' },
    ],
  },
  {
    id: 'coverage', title: 'Managing Service Areas', icon: '📍',
    steps: [
      { num: '1', title: 'Open Area menu', desc: 'Click "Area" in the navbar to manage the list of served areas.' },
      { num: '2', title: 'Add a new area', desc: 'Click "+ Add Area", fill in area name and slug (format: seminyak, nusa-dua).' },
      { num: '3', title: 'Fill estimates and fees', desc: 'Fill in arrival estimate (minutes) and extra fee if applicable (in Rupiah).' },
      { num: '4', title: 'Deactivate an area', desc: 'Click "Deactivate" to hide an area from public without deleting the data.' },
    ],
  },
  {
    id: 'settings', title: 'Site Settings', icon: '⚙️',
    steps: [
      { num: '1', title: 'Open Settings', desc: 'Click "Settings" in the sidebar to edit site settings.' },
      { num: '2', title: 'WhatsApp Number', desc: 'Enter the number without + or spaces. Example: 6281234567890.' },
      { num: '3', title: 'Operating Hours', desc: 'Set opening and closing times per day. Toggle "Closed" for days off.' },
      { num: '4', title: 'Save', desc: 'Click "Save Settings". Changes take effect immediately.' },
    ],
  },
];

const TIPS_ID: Tip[] = [
  { icon: '🔒', title: 'Keamanan', desc: 'Jangan bagikan password ke siapapun. Logout setelah selesai menggunakan admin.' },
  { icon: '📱', title: 'Nomor WA', desc: 'Selalu masukkan nomor WhatsApp tanpa +62 di depan. Cukup 08xxx. Sistem akan mengkonversi otomatis.' },
  { icon: '⚡', title: 'Perubahan Langsung', desc: 'Hampir semua perubahan (FAQ, Area, Social Links) langsung tampil di publik tanpa perlu refresh manual.' },
  { icon: '🏥', title: 'Konten Medis', desc: 'Hindari kata "menyembuhkan", "garansi", atau "pasti sembuh". Gunakan "membantu mendukung" atau "dirancang untuk".' },
];

const TIPS_EN: Tip[] = [
  { icon: '🔒', title: 'Security', desc: "Don't share your password with anyone. Log out after you're done using the admin panel." },
  { icon: '📱', title: 'WA Number', desc: 'Always enter the WhatsApp number without the +62 prefix. Just 08xxx. The system converts automatically.' },
  { icon: '⚡', title: 'Live Changes', desc: 'Most changes (FAQ, Areas, Social Links) appear publicly immediately without needing a manual refresh.' },
  { icon: '🏥', title: 'Medical Content', desc: 'Avoid words like "cures", "guarantee", or "definitely heals". Use "helps support" or "designed for".' },
];

export default function GuideContent() {
  const { lang } = useAdminLang();

  const sections = lang === 'en' ? GUIDE_SECTIONS_EN : GUIDE_SECTIONS_ID;
  const tips      = lang === 'en' ? TIPS_EN : TIPS_ID;
  const title     = lang === 'en' ? 'Admin Guide' : 'Panduan Admin';
  const subtitle  = lang === 'en'
    ? 'CMS usage guide for the non-technical Drips To You Bali team.'
    : 'Panduan penggunaan CMS untuk tim non-teknis Drips To You Bali.';
  const footerNote = lang === 'en'
    ? 'Need help? Contact the technical team or see the documentation in the repository.'
    : 'Butuh bantuan? Hubungi tim teknis atau lihat dokumentasi di repository.';

  return (
    <div className="admin-page" style={{ maxWidth: 900 }}>
      <div className="admin-page-head" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="admin-title">{title}</h1>
          <p className="admin-subtitle">{subtitle}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {tips.map((tip) => (
          <div key={tip.icon} style={{ background: 'var(--pale-aqua)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{tip.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--teal)', marginBottom: 4 }}>{tip.title}</div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{tip.desc}</div>
          </div>
        ))}
      </div>

      {sections.map((section) => (
        <div key={section.id} className="form-card" style={{ marginBottom: 24 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, color: 'var(--teal)', marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>{section.icon}</span>
            {section.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {section.steps.map((step) => (
              <div key={step.num} style={{ display: 'flex', gap: 14 }}>
                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
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

      <div style={{ textAlign: 'center', padding: '24px 0', color: '#888', fontSize: 13 }}>
        {footerNote}
      </div>
    </div>
  );
}
