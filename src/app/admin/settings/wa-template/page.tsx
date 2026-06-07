'use client';

import { useEffect, useRef, useState } from 'react';

const SAMPLE_DATA: Record<string, string> = {
  customer_name:  'Sarah Johnson',
  treatment_name: 'Hangover Recovery',
  booking_date:   '15 June 2026',
  booking_time:   '10:00',
  location:       'Villa Seminyak Indah',
  address:        'Jl. Oberoi No.12, Seminyak, Bali 80361',
  phone:          '6281234567890',
  notes:          'Please arrive before 10 AM',
  booking_id:     'DTY-2026-001',
};

type ApiData = {
  template: string;
  defaultTemplate: string;
  allowedPlaceholders: string[];
};
type ApiResponse<T> = { data?: T; error?: string; success?: boolean; message?: string };

function applyTemplate(template: string, data: Record<string, string>) {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => data[key] ?? `{${key}}`);
}

function normalizeWa(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0'))  return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('8'))  return '62' + digits;
  return digits;
}

export default function WaTemplatePage() {
  const [template,     setTemplate]     = useState('');
  const [defaultTpl,   setDefaultTpl]   = useState('');
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/admin/wa-template')
      .then((r) => r.json() as Promise<ApiResponse<ApiData>>)
      .then((json) => {
        if (json.data) {
          setTemplate(json.data.template);
          setDefaultTpl(json.data.defaultTemplate);
          setPlaceholders(json.data.allowedPlaceholders);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function insertPlaceholder(key: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start  = ta.selectionStart;
    const end    = ta.selectionEnd;
    const before = template.slice(0, start);
    const after  = template.slice(end);
    const token  = `{${key}}`;
    const next   = before + token + after;
    setTemplate(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res  = await fetch('/api/admin/wa-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      });
      const json = (await res.json()) as ApiResponse<null>;
      if (!res.ok) { setError(json.error ?? 'Gagal menyimpan'); return; }
      setSuccess(json.message ?? 'Template berhasil disimpan.');
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!confirm('Reset ke template default? Perubahan yang belum disimpan akan hilang.')) return;
    setTemplate(defaultTpl);
  }

  function handleTestOpen() {
    const waNumber = normalizeWa(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281200000000');
    const msg      = applyTemplate(template, SAMPLE_DATA);
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }

  const preview = applyTemplate(template, SAMPLE_DATA);

  if (loading) {
    return (
      <div className="admin-page" style={{ maxWidth: 900 }}>
        <div className="skeleton-line" style={{ width: 280, height: 28, marginBottom: 28 }} />
        <div className="form-card"><div className="skeleton-line" style={{ height: 180 }} /></div>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ maxWidth: 900 }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">WhatsApp Template</h1>
          <p className="admin-subtitle">Atur format pesan WhatsApp yang dikirim ke pelanggan saat booking.</p>
        </div>
      </div>

      {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <form onSubmit={handleSave}>
        <div className="wa-template-layout">
          {/* ── Left: editor ── */}
          <section className="form-card">
            <h2 className="form-card-title">Template Pesan</h2>

            <div className="admin-field">
              <span className="admin-field-label">Placeholder Tersedia</span>
              <div className="wa-placeholder-chips">
                {placeholders.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="wa-chip"
                    onClick={() => insertPlaceholder(p)}
                    title={`Sisipkan {${p}}`}
                  >
                    {`{${p}}`}
                  </button>
                ))}
              </div>
              <span className="admin-help">Klik placeholder untuk menyisipkannya ke posisi kursor di textarea.</span>
            </div>

            <label className="admin-field" style={{ marginTop: 16 }}>
              <span className="admin-field-label">Isi Template</span>
              <textarea
                ref={textareaRef}
                className="control wa-template-textarea"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={12}
                spellCheck={false}
                required
              />
            </label>

            <div className="admin-form-actions" style={{ marginTop: 20 }}>
              <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan Template'}
              </button>
              <button type="button" className="button button-secondary" onClick={handleReset}>
                Reset Default
              </button>
              <button type="button" className="button button-secondary" onClick={handleTestOpen}>
                Test Buka WhatsApp
              </button>
            </div>
          </section>

          {/* ── Right: preview ── */}
          <section className="form-card wa-preview-card">
            <h2 className="form-card-title">Preview Pesan</h2>
            <p className="admin-help" style={{ marginBottom: 12 }}>Menggunakan data sampel. Placeholder yang tidak dikenal akan tampil apa adanya.</p>
            <div className="wa-preview-bubble">
              <div className="wa-preview-text">{preview}</div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
