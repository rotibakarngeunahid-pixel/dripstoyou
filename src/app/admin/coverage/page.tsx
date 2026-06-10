'use client';

import { useEffect, useState } from 'react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

type Area = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  estimatedArrivalMinutes: number | null;
  extraFeeAmount: number | null;
  note: string | null;
  sortOrder: number;
};

type ApiResponse<T> = { data?: T; error?: string; message?: string; success?: boolean };

const EMPTY = {
  name: '',
  slug: '',
  isActive: true,
  estimatedArrivalMinutes: '' as string | number,
  extraFeeAmount: '' as string | number,
  note: '',
  sortOrder: 0,
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function formatFee(amount: number | null, freeLabel: string) {
  if (amount === null || amount === undefined) return null;
  if (amount === 0) return freeLabel;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/* ─── Confirm Modal ─── */
function ConfirmModal({
  open, title, message, confirmLabel, danger, loading,
  onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string;
  confirmLabel: string; danger?: boolean; loading?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 32,
        maxWidth: 460, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-playfair,Georgia,serif)', color: '#b33223', fontSize: 20, marginBottom: 10 }}>
          {title}
        </h3>
        <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 24, whiteSpace: 'pre-line' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className="button button-secondary"
            style={{ minHeight: 40, padding: '8px 18px', fontSize: 13 }}
            onClick={onCancel} type="button" disabled={loading}
          >
            Cancel
          </button>
          <button
            className="button"
            style={{
              minHeight: 40, padding: '8px 18px', fontSize: 13,
              background: danger ? '#dc2626' : 'var(--teal)',
              color: 'white', border: 'none',
              opacity: loading ? 0.7 : 1,
            }}
            onClick={onConfirm} type="button" disabled={loading}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div role="status" aria-live="polite" className={`admin-toast ${type === 'success' ? 'admin-toast--success' : 'admin-toast--error'}`}>
      {msg}
    </div>
  );
}

/* ─── Area Card ─── */
function AreaCard({
  area, t, onEdit, onDelete, deleting,
}: {
  area: Area;
  t: Record<string, string>;
  onEdit: (a: Area) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  const fee = formatFee(area.extraFeeAmount, t.gratisLabel);

  return (
    <div style={{
      background: 'white',
      border: `1.5px solid ${area.isActive ? 'rgba(32,82,81,0.12)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: 18, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 14,
      boxShadow: area.isActive ? '0 4px 20px rgba(32,82,81,0.07)' : '0 2px 8px rgba(0,0,0,0.04)',
      opacity: area.isActive ? 1 : 0.72,
      transition: 'box-shadow .2s, opacity .2s',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: 14, right: 14,
        background: 'var(--champagne)', color: 'var(--teal)',
        fontSize: 10, fontWeight: 800, padding: '2px 8px',
        borderRadius: 999, letterSpacing: 1,
      }}>
        #{area.sortOrder}
      </span>

      <div style={{ paddingRight: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: area.isActive ? '#22c55e' : '#d1d5db', flexShrink: 0,
          }} />
          <h3 style={{
            fontFamily: 'var(--font-playfair,Georgia,serif)',
            fontSize: 18, fontWeight: 700,
            color: area.isActive ? 'var(--teal)' : '#888', lineHeight: 1.2,
          }}>
            {area.name}
          </h3>
        </div>
        <code style={{
          fontSize: 11, color: '#9a9a9a', background: '#f5f5f5',
          padding: '2px 8px', borderRadius: 6, display: 'inline-block',
        }}>
          {area.slug}
        </code>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {area.estimatedArrivalMinutes !== null && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'var(--pale-aqua)', color: 'var(--teal)',
            fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 999,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {area.estimatedArrivalMinutes} {t.menitLabel}
          </span>
        )}
        {fee && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: fee === t.gratisLabel ? '#f0fdf4' : '#fffbeb',
            color: fee === t.gratisLabel ? '#166534' : '#92400e',
            fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 999,
          }}>
            {fee === t.gratisLabel ? `✓ ${t.gratisLabel}` : `+ ${fee}`}
          </span>
        )}
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          background: area.isActive ? 'var(--pale-aqua)' : '#f3f4f6',
          color: area.isActive ? 'var(--teal)' : '#6b7280',
          fontSize: 11, fontWeight: 700, padding: '4px 10px',
          borderRadius: 999, letterSpacing: 0.5,
        }}>
          {area.isActive ? t.statusAktif : t.statusNonaktif}
        </span>
      </div>

      {area.note && (
        <p style={{ fontSize: 12, color: '#888', lineHeight: 1.5, margin: 0 }}>
          {area.note}
        </p>
      )}

      <div style={{ borderTop: '1px solid #f0ede8', paddingTop: 14, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        <button
          className="button button-secondary"
          style={{ padding: '7px 14px', fontSize: 12, minHeight: 34, flex: '1 1 auto' }}
          onClick={() => onEdit(area)} type="button"
        >
          {t.edit}
        </button>
        <button
          className="button"
          style={{ padding: '7px 14px', fontSize: 12, minHeight: 34, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
          onClick={() => onDelete(area.id)}
          disabled={deleting === area.id} type="button"
        >
          {deleting === area.id ? '...' : t.hapus}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminCoveragePage() {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [areas,    setAreas]    = useState<Area[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [pageErr,  setPageErr]  = useState('');
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm,  setConfirm]  = useState<{
    open: boolean; title: string; message: string; confirmLabel: string;
    danger?: boolean; loading?: boolean; onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} });

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    setLoading(true);
    setPageErr('');
    try {
      const res  = await fetch('/api/admin/coverage', { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<Area[]>;
      if (!res.ok) { setAreas([]); setPageErr(json.message ?? json.error ?? t.gagalMemuat); return; }
      setAreas(json.data ?? []);
    } catch {
      setAreas([]); setPageErr(t.koneksiAreaFailed);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm(EMPTY); setEditId(null); setFormErr(''); setShowForm(true);
  }

  function openEdit(area: Area) {
    setForm({
      name: area.name, slug: area.slug, isActive: area.isActive,
      estimatedArrivalMinutes: area.estimatedArrivalMinutes ?? '',
      extraFeeAmount: area.extraFeeAmount ?? '',
      note: area.note ?? '', sortOrder: area.sortOrder,
    });
    setEditId(area.id); setFormErr(''); setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setFormErr(''); }

  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, ...(editId ? {} : { slug: toSlug(name) }) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) { setFormErr(t.namaSlugRequired); return; }
    if (!/^[a-z0-9-]+$/.test(form.slug)) { setFormErr(t.slugFormatError); return; }
    setSaving(true); setFormErr('');
    const body = {
      name: form.name.trim(), slug: form.slug.trim(), isActive: form.isActive,
      estimatedArrivalMinutes: form.estimatedArrivalMinutes !== '' ? Number(form.estimatedArrivalMinutes) : null,
      extraFeeAmount: form.extraFeeAmount !== '' ? Number(form.extraFeeAmount) : null,
      note: form.note || null, sortOrder: Number(form.sortOrder),
    };
    try {
      const method = editId ? 'PUT' : 'POST';
      const url    = editId ? `/api/admin/coverage/${editId}` : '/api/admin/coverage';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json   = (await res.json()) as ApiResponse<Area>;
      if (!res.ok) { setFormErr(json.message ?? json.error ?? t.gagalMenyimpanArea); return; }
      showToast(editId ? t.areaDiperbarui : t.areaDitambah);
      setShowForm(false); setEditId(null); await load();
    } catch {
      setFormErr(t.koneksiAreaFailed);
    } finally {
      setSaving(false);
    }
  }

  function askDelete(id: string) {
    const area = areas.find(a => a.id === id);
    if (!area) return;

    const title = lang === 'id'
      ? `⚠️ Hapus Area Layanan`
      : `⚠️ Delete Service Area`;

    const msg = lang === 'id'
      ? `Anda akan menghapus area "${area.name}" secara permanen.\n\nSemua booking yang terhubung akan kehilangan referensi area ini. Tindakan ini tidak dapat dibatalkan.`
      : `You are about to permanently delete the area "${area.name}".\n\nAll linked bookings will lose their area reference. This action cannot be undone.`;

    setConfirm({
      open: true, danger: true,
      title,
      message: msg,
      confirmLabel: lang === 'id' ? `Hapus "${area.name}"` : `Delete "${area.name}"`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        setDeleting(id);
        try {
          const res = await fetch(`/api/admin/coverage/${id}`, { method: 'DELETE' });
          const json = (await res.json()) as ApiResponse<null>;
          if (res.ok && json.success) {
            setConfirm(c => ({ ...c, open: false, loading: false }));
            showToast(t.areaHapus);
            await load();
          } else {
            showToast(json.message ?? json.error ?? t.gagalMemuat, 'error');
            setConfirm(c => ({ ...c, open: false, loading: false }));
          }
        } catch {
          showToast(t.koneksiFailed, 'error');
          setConfirm(c => ({ ...c, open: false, loading: false }));
        } finally {
          setDeleting(null);
        }
      },
    });
  }

  const activeCount   = areas.filter(a => a.isActive).length;
  const inactiveCount = areas.length - activeCount;

  return (
    <div className="admin-page">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        loading={confirm.loading}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.coverageTitle}</h1>
          <p className="admin-subtitle">{t.coverageSubtitle}</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreate}>
          {t.tambahArea}
        </button>
      </div>

      {!loading && areas.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: t.totalArea,      value: areas.length,   color: 'var(--teal)', bg: 'var(--pale-aqua)' },
            { label: t.statusAktif,    value: activeCount,    color: '#166534',     bg: '#dcfce7' },
            { label: t.statusNonaktif, value: inactiveCount,  color: '#6b7280',     bg: '#f3f4f6' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'white', border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 14, padding: '14px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minWidth: 140,
            }}>
              <span style={{
                width: 42, height: 42, borderRadius: 12, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-playfair,Georgia,serif)',
                fontSize: 20, fontWeight: 700, color: s.color,
              }}>
                {s.value}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {pageErr && <div className="alert alert-error" style={{ marginBottom: 20 }}>{pageErr}</div>}

      {showForm && (
        <div className="form-card" style={{ marginBottom: 28, borderLeft: '4px solid var(--teal)' }}>
          <h2 className="form-card-title">{editId ? t.editAreaTitle : t.tambahAreaBaru}</h2>
          {formErr && <div className="alert alert-error" style={{ marginBottom: 14 }}>{formErr}</div>}
          <form onSubmit={handleSave}>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span className="admin-field-label">{t.namaAreaLabel}</span>
                <input
                  className="control" value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Seminyak" required
                />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">{t.slugLabel}</span>
                <input
                  className="control" value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="seminyak" required
                />
                <span style={{ fontSize: 11, color: '#888' }}>{t.slugHelp}</span>
              </label>
              <label className="admin-field">
                <span className="admin-field-label">{t.estimasiTiba}</span>
                <input
                  className="control" type="number" min={1}
                  value={form.estimatedArrivalMinutes}
                  onChange={e => setForm(f => ({ ...f, estimatedArrivalMinutes: e.target.value }))}
                  placeholder="30"
                />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">{t.biayaTambahan}</span>
                <input
                  className="control" type="number" min={0} step={1000}
                  value={form.extraFeeAmount}
                  onChange={e => setForm(f => ({ ...f, extraFeeAmount: e.target.value }))}
                  placeholder="0"
                />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">{t.urutan ?? 'Urutan'}</span>
                <input
                  className="control" type="number" min={0}
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))}
                />
              </label>
            </div>
            <label className="admin-field" style={{ marginTop: 14 }}>
              <span className="admin-field-label">{t.catatanOpsionalLabel}</span>
              <input
                className="control" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder={t.catatanAreaPlaceholder}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--teal)' }}
              />
              <span style={{ fontSize: 14, color: 'var(--text)' }}>{t.tampilPublik}</span>
            </label>
            <div className="admin-form-actions" style={{ marginTop: 20 }}>
              <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
                {saving ? t.menyimpan : editId ? t.simpanPerubahan : t.tambahAreaBtn}
              </button>
              <button className="button button-secondary" type="button" onClick={cancelForm} disabled={saving}>
                {t.batal}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 18 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 18 }} />
          ))}
        </div>
      ) : areas.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{t.belumAdaArea}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 18 }}>
          {areas.map(area => (
            <AreaCard
              key={area.id} area={area} t={t}
              onEdit={openEdit}
              onDelete={askDelete}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
