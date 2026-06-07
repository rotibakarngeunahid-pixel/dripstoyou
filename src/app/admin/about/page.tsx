'use client';

import { useEffect, useState } from 'react';

type AboutFields = {
  heroTagline: string;
  heroParagraph: string;
  missionStatement: string;
  teamIntro: string;
};

export type LocalizedAboutContent = {
  en: AboutFields;
  id: AboutFields;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

const EMPTY_FIELDS: AboutFields = {
  heroTagline: '',
  heroParagraph: '',
  missionStatement: '',
  teamIntro: '',
};

const EMPTY: LocalizedAboutContent = {
  en: { ...EMPTY_FIELDS },
  id: { ...EMPTY_FIELDS },
};

const FIELD_LABELS: { key: keyof AboutFields; en: string; id: string; rows?: number }[] = [
  { key: 'heroTagline', en: 'Hero Tagline', id: 'Tagline Hero' },
  { key: 'heroParagraph', en: 'Hero Paragraph', id: 'Paragraf Hero', rows: 4 },
  { key: 'missionStatement', en: 'Mission Statement', id: 'Pernyataan Misi', rows: 4 },
  { key: 'teamIntro', en: 'Team Introduction', id: 'Perkenalan Tim', rows: 4 },
];

export default function AdminAboutPage() {
  const [form, setForm] = useState<LocalizedAboutContent>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/admin/about', { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json()) as ApiResponse<LocalizedAboutContent>;
        if (!res.ok) throw new Error(json.message ?? json.error ?? 'Gagal memuat konten About.');
        setForm({
          en: { ...EMPTY_FIELDS, ...json.data?.en },
          id: { ...EMPTY_FIELDS, ...json.data?.id },
        });
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  function update(lang: 'en' | 'id', key: keyof AboutFields, value: string) {
    setForm((current) => ({
      ...current,
      [lang]: { ...current[lang], [key]: value },
    }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as ApiResponse<LocalizedAboutContent>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Gagal menyimpan konten About.');
        return;
      }
      setSuccess(json.message ?? 'Konten About berhasil disimpan.');
      window.setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Koneksi ke backend About gagal.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="form-card">
          {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton-line" style={{ marginBottom: 16, height: 60 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Kelola Halaman About</h1>
          <p className="admin-subtitle">Konten kosong akan menggunakan terjemahan bawaan website.</p>
        </div>
        <a href="/about" target="_blank" rel="noopener noreferrer" className="button button-secondary">
          Lihat Halaman
        </a>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <form onSubmit={handleSave}>
        <div className="two-col-grid">
          {(['en', 'id'] as const).map((lang) => (
            <section className="form-card" key={lang}>
              <h2 className="form-card-title">{lang === 'en' ? 'English' : 'Bahasa Indonesia'}</h2>
              {FIELD_LABELS.map((field) => (
                <label className="admin-field" style={{ marginTop: 14 }} key={field.key}>
                  <span className="admin-field-label">{lang === 'en' ? field.en : field.id}</span>
                  {field.rows ? (
                    <textarea className="control" rows={field.rows} value={form[lang][field.key]} onChange={(e) => update(lang, field.key, e.target.value)} />
                  ) : (
                    <input className="control" value={form[lang][field.key]} onChange={(e) => update(lang, field.key, e.target.value)} />
                  )}
                </label>
              ))}
            </section>
          ))}
        </div>

        <div className="admin-form-actions" style={{ marginTop: 20 }}>
          <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
