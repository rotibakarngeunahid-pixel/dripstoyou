'use client';

import { useEffect, useState } from 'react';

type AboutContent = {
  heroTagline?: string;
  heroParagraph?: string;
  missionStatement?: string;
  teamIntro?: string;
};

type ApiResponse<T> = { data?: T; error?: string };

const DEFAULTS: AboutContent = {
  heroTagline: 'Kesehatan di Ujung Jari Anda',
  heroParagraph: 'Drips To You - Bali adalah layanan IV therapy on-call profesional yang hadir langsung ke villa, hotel, atau tempat menginap Anda di Bali.',
  missionStatement: '',
  teamIntro: '',
};

export default function AdminAboutPage() {
  const [form, setForm] = useState<AboutContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/about');
        const json = (await res.json()) as ApiResponse<AboutContent>;
        if (json.data) setForm({ ...DEFAULTS, ...json.data });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as ApiResponse<AboutContent>;
      if (!res.ok) { setError(json.error ?? 'Gagal menyimpan.'); return; }
      showToast('Konten About berhasil disimpan.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="form-card">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-line" style={{ marginBottom: 16, height: 60 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {toast && (
        <div className="alert" style={{ marginBottom: 16, background: '#ecfdf3', border: '1px solid #b7e4c7', color: '#167a3f' }}>
          {toast}
        </div>
      )}

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Kelola Halaman About</h1>
          <p className="admin-subtitle">Teks hero, misi, dan perkenalan tim di halaman Tentang Kami.</p>
        </div>
        <a href="/about" target="_blank" rel="noopener noreferrer" className="button button-secondary">
          Lihat Halaman ↗
        </a>
      </div>

      <div className="form-card">
        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSave}>
          <label className="admin-field">
            <span className="admin-field-label">Tagline Hero</span>
            <input
              className="control"
              value={form.heroTagline ?? ''}
              onChange={(e) => setForm(f => ({ ...f, heroTagline: e.target.value }))}
              placeholder="Kesehatan di Ujung Jari Anda"
            />
            <span style={{ fontSize: 11, color: '#888' }}>Judul utama di hero section halaman About.</span>
          </label>

          <label className="admin-field" style={{ marginTop: 16 }}>
            <span className="admin-field-label">Paragraf Hero</span>
            <textarea
              className="control"
              rows={4}
              value={form.heroParagraph ?? ''}
              onChange={(e) => setForm(f => ({ ...f, heroParagraph: e.target.value }))}
              placeholder="Drips To You - Bali adalah layanan IV therapy on-call profesional..."
            />
            <span style={{ fontSize: 11, color: '#888' }}>Teks deskripsi singkat di bawah judul hero.</span>
          </label>

          <label className="admin-field" style={{ marginTop: 16 }}>
            <span className="admin-field-label">Pernyataan Misi</span>
            <textarea
              className="control"
              rows={3}
              value={form.missionStatement ?? ''}
              onChange={(e) => setForm(f => ({ ...f, missionStatement: e.target.value }))}
              placeholder="Misi kami adalah memberikan layanan kesehatan terbaik..."
            />
          </label>

          <label className="admin-field" style={{ marginTop: 16 }}>
            <span className="admin-field-label">Perkenalan Tim</span>
            <textarea
              className="control"
              rows={3}
              value={form.teamIntro ?? ''}
              onChange={(e) => setForm(f => ({ ...f, teamIntro: e.target.value }))}
              placeholder="Tim kami terdiri dari perawat dan dokter berlisensi..."
            />
          </label>

          <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--pale-aqua)', borderRadius: 8, fontSize: 13, color: 'var(--teal)' }}>
            <strong>Catatan medis:</strong> Gunakan bahasa yang hati-hati. Contoh: &quot;membantu mendukung pemulihan&quot;, bukan &quot;menyembuhkan penyakit&quot;.
          </div>

          <div className="admin-form-actions" style={{ marginTop: 20 }}>
            <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
