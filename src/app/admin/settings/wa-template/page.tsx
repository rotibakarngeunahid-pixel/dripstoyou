'use client';

import { useEffect, useRef, useState } from 'react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

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

type ApiData = { template: string; defaultTemplate: string; allowedPlaceholders: string[] };
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
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [template,     setTemplate]     = useState('');
  const [defaultTpl,   setDefaultTpl]   = useState('');
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [testWaNumber, setTestWaNumber] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/wa-template').then((r) => r.json() as Promise<ApiResponse<ApiData>>),
      fetch('/api/public/settings', { cache: 'no-store' }).then((r) => r.json()),
    ]).then(([tplJson, settingsJson]) => {
      if (tplJson.data) {
        setTemplate(tplJson.data.template);
        setDefaultTpl(tplJson.data.defaultTemplate);
        setPlaceholders(tplJson.data.allowedPlaceholders);
      }
      if (typeof settingsJson.data?.whatsappNumber === 'string') {
        setTestWaNumber(normalizeWa(settingsJson.data.whatsappNumber));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
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
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch('/api/admin/wa-template', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template }) });
      const json = (await res.json()) as ApiResponse<null>;
      if (!res.ok) { setError(json.error ?? t.gagalMenyimpan); return; }
      setSuccess(json.message ?? t.berhasilDisimpan);
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError(t.koneksiFailed);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() { setConfirmReset(false); setTemplate(defaultTpl); }

  function handleTestOpen() {
    const waNumber = testWaNumber || normalizeWa(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281200000000');
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
      <ConfirmModal
        open={confirmReset}
        title={t.resetTemplateTitle}
        message={t.resetTemplateMsg}
        confirmLabel={t.resetDefaultBtn}
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.waTemplateTitle}</h1>
          <p className="admin-subtitle">{t.waTemplateSubtitle}</p>
        </div>
      </div>

      {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <form onSubmit={handleSave}>
        <div className="wa-template-layout">
          {/* ── Left: editor ── */}
          <section className="form-card">
            <h2 className="form-card-title">{t.templatePesan}</h2>

            <div className="admin-field">
              <span className="admin-field-label">{t.placeholderTersedia}</span>
              <div className="wa-placeholder-chips">
                {placeholders.map((p) => (
                  <button key={p} type="button" className="wa-chip" onClick={() => insertPlaceholder(p)} title={`Insert {${p}}`}>
                    {`{${p}}`}
                  </button>
                ))}
              </div>
              <span className="admin-help">{t.klikPlaceholder}</span>
            </div>

            <label className="admin-field" style={{ marginTop: 16 }}>
              <span className="admin-field-label">{t.isiTemplate}</span>
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
                {saving ? t.menyimpanTemplate : t.simpanTemplate}
              </button>
              <button type="button" className="button button-secondary" onClick={() => setConfirmReset(true)} disabled={saving}>
                {t.resetDefault}
              </button>
              <button type="button" className="button button-secondary" onClick={handleTestOpen} disabled={saving}>
                {t.testBukaWA}
              </button>
            </div>
          </section>

          {/* ── Right: preview ── */}
          <section className="form-card wa-preview-card">
            <h2 className="form-card-title">{t.previewPesan}</h2>
            <p className="admin-help" style={{ marginBottom: 12 }}>{t.previewHelp}</p>
            <div className="wa-preview-bubble">
              <div className="wa-preview-text">{preview}</div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
