'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => { setSettings(d.settings ?? {}); setLoading(false); })
      .catch(() => setLoading(false));
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
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal menyimpan'); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ padding: '32px 24px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ height: 32, width: 220, borderRadius: 8, marginBottom: 28, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
      {[1,2,3].map((i) => (
        <div key={i} style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 28, marginBottom: 20 }}>
          <div style={{ height: 20, width: 180, borderRadius: 6, marginBottom: 20, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
          <div style={{ height: 40, borderRadius: 8, background: 'linear-gradient(90deg,#e8e6e1 25%,#f3f1ec 50%,#e8e6e1 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite linear' }} />
        </div>
      ))}
    </div>
  );

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #DBDAD7', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#6b7e7e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#205251', marginBottom: 28 }}>Pengaturan Situs</h1>

      {error && <div style={{ background: '#fee2e222', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: '#dcfce722', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontSize: 13, marginBottom: 16 }}>Pengaturan berhasil disimpan!</div>}

      <form onSubmit={save}>
        <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 28, boxShadow: '0 2px 8px rgba(32,82,81,0.06)', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#205251', marginBottom: 20 }}>Kontak & WhatsApp</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nomor WhatsApp (format: 628xxx)</label>
            <input value={settings.whatsapp_number ?? ''} onChange={(e) => updateField('whatsapp_number', e.target.value)} placeholder="6281234567890" style={inputStyle} pattern="\d{10,15}" />
            <p style={{ color: '#6b7e7e', fontSize: 11, marginTop: 4 }}>Tanpa tanda + atau spasi. Contoh: 6281234567890</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Bisnis</label>
            <input type="email" value={settings.site_email ?? ''} onChange={(e) => updateField('site_email', e.target.value)} placeholder="hello@dripstoyou.com" style={inputStyle} />
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 28, boxShadow: '0 2px 8px rgba(32,82,81,0.06)', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#205251', marginBottom: 20 }}>Operasional</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Jam Operasional</label>
              <input value={settings.business_hours ?? ''} onChange={(e) => updateField('business_hours', e.target.value)} placeholder="08:00-22:00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Waktu Respons (menit)</label>
              <input type="number" value={settings.response_time_minutes ?? ''} onChange={(e) => updateField('response_time_minutes', e.target.value)} placeholder="60" min="1" style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #DBDAD7', borderRadius: 16, padding: 28, boxShadow: '0 2px 8px rgba(32,82,81,0.06)', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 16, fontWeight: 600, color: '#205251', marginBottom: 20 }}>Info Situs</h2>

          <div>
            <label style={labelStyle}>Nama Situs</label>
            <input value={settings.site_name ?? ''} onChange={(e) => updateField('site_name', e.target.value)} placeholder="Drips To You - Bali" style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ padding: '12px 32px', background: '#205251', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </div>
  );
}
