'use client';

import { useEffect, useState } from 'react';

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json() as Promise<ApiResponse<Record<string, string>>>)
      .then((json) => {
        setSettings(json.data ?? {});
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal memuat pengaturan.');
        setLoading(false);
      });
  }, []);

  function updateField(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_number: settings.whatsapp_number,
          business_hours: settings.business_hours,
          response_time_minutes: settings.response_time_minutes,
          site_name: settings.site_name,
          site_email: settings.site_email,
        }),
      });
      const json = (await res.json()) as ApiResponse<null>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Gagal menyimpan');
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page" style={{ maxWidth: 760 }}>
        <div className="skeleton-line" style={{ width: 220, height: 28, marginBottom: 28 }} />
        {[1, 2, 3].map((item) => (
          <div className="form-card" key={item} style={{ marginBottom: 16 }}>
            <div className="skeleton-line" style={{ width: 180, height: 20, marginBottom: 20 }} />
            <div className="skeleton-button" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ maxWidth: 760 }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Pengaturan Situs</h1>
          <p className="admin-subtitle">Kontak, jam operasional, dan identitas website.</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && (
        <div className="alert" style={{ marginBottom: 16, background: '#ecfdf3', border: '1px solid #b7e4c7', color: '#167a3f' }}>
          Pengaturan berhasil disimpan.
        </div>
      )}

      <form className="admin-form" onSubmit={save}>
        <section className="form-card">
          <h2 className="form-card-title">Kontak & WhatsApp</h2>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">Nomor WhatsApp</span>
              <input
                className="control"
                value={settings.whatsapp_number ?? ''}
                onChange={(e) => updateField('whatsapp_number', e.target.value)}
                placeholder="6281234567890"
                pattern="\d{10,15}"
              />
              <span className="admin-help">Tanpa tanda + atau spasi. Contoh: 6281234567890</span>
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Email Bisnis</span>
              <input
                className="control"
                type="email"
                value={settings.site_email ?? ''}
                onChange={(e) => updateField('site_email', e.target.value)}
                placeholder="hello@dripstoyou.com"
              />
            </label>
          </div>
        </section>

        <section className="form-card">
          <h2 className="form-card-title">Operasional</h2>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">Jam Operasional</span>
              <input
                className="control"
                value={settings.business_hours ?? ''}
                onChange={(e) => updateField('business_hours', e.target.value)}
                placeholder="08:00-22:00"
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Waktu Respons (menit)</span>
              <input
                className="control"
                type="number"
                value={settings.response_time_minutes ?? ''}
                onChange={(e) => updateField('response_time_minutes', e.target.value)}
                placeholder="60"
                min="1"
              />
            </label>
          </div>
        </section>

        <section className="form-card">
          <h2 className="form-card-title">Info Situs</h2>
          <label className="admin-field">
            <span className="admin-field-label">Nama Situs</span>
            <input
              className="control"
              value={settings.site_name ?? ''}
              onChange={(e) => updateField('site_name', e.target.value)}
              placeholder="Drips To You - Bali"
            />
          </label>
        </section>

        <div className="admin-form-actions">
          <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
            {saving ? 'Menyimpan' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
