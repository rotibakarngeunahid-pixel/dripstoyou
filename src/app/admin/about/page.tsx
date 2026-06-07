export default function AdminAboutPage() {
  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Halaman About</h1>
          <p className="admin-subtitle">Konten halaman About dikelola langsung di kode website.</p>
        </div>
        <a href="/about" target="_blank" rel="noopener noreferrer" className="button button-secondary">
          Lihat Halaman
        </a>
      </div>

      <div className="surface-card" style={{ padding: 32, marginTop: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 20px' }}>
          Halaman About sudah diubah menjadi konten statis yang tertanam langsung di website.
          Untuk mengubah teks atau struktur halaman, edit file kode sumber melalui developer.
        </p>
        <a
          href="/about"
          target="_blank"
          rel="noopener noreferrer"
          className="button button-primary"
        >
          Lihat Halaman About →
        </a>
      </div>
    </div>
  );
}
