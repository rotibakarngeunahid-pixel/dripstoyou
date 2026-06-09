'use client';

import { useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

type SocialLink = {
  id: string;
  platform: string;
  label: string;
  value: string;
  normalizedUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

type ApiResponse<T> = { data?: T; error?: string; message?: string; success?: boolean };

const PLATFORMS = [
  { value: 'WHATSAPP',    label: 'WhatsApp',    hint: 'Nomor HP (misal: 081234567890)' },
  { value: 'INSTAGRAM',   label: 'Instagram',   hint: 'Username (misal: @dripstoyou.bali)' },
  { value: 'TIKTOK',      label: 'TikTok',      hint: 'Username (misal: @dripstoyou)' },
  { value: 'FACEBOOK',    label: 'Facebook',    hint: 'URL profil lengkap' },
  { value: 'GOOGLE_MAPS', label: 'Google Maps', hint: 'URL Google Maps' },
  { value: 'EMAIL',       label: 'Email',       hint: 'Alamat email' },
  { value: 'WEBSITE',     label: 'Website',     hint: 'URL website (https://...)' },
  { value: 'CUSTOM',      label: 'Custom',      hint: 'URL lengkap' },
];

const EMPTY = { platform: 'INSTAGRAM', label: '', value: '', isActive: true, sortOrder: 0 };

function platformLabel(platform: string) {
  return PLATFORMS.find(p => p.value === platform)?.label ?? platform;
}
function platformHint(platform: string) {
  return PLATFORMS.find(p => p.value === platform)?.hint ?? '';
}

export default function AdminSocialLinksPage() {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [links,    setLinks]    = useState<SocialLink[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState('');
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm,  setConfirm]  = useState<{
    open: boolean; title: string; message: string;
    confirmLabel: string; loadingLabel?: string; danger?: boolean; loading?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} });

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/admin/social-links', { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<SocialLink[]>;
      if (!res.ok) { setLinks([]); setError(json.message ?? json.error ?? t.gagalMemuatLink); return; }
      setLinks(json.data ?? []);
    } catch {
      setLinks([]); setError(t.koneksiLinkFailed);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() { setForm(EMPTY); setEditId(null); setError(''); setShowForm(true); }

  function openEdit(link: SocialLink) {
    setForm({ platform: link.platform, label: link.label, value: link.value, isActive: link.isActive, sortOrder: link.sortOrder });
    setEditId(link.id); setError(''); setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setError(''); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim() || !form.value.trim()) { setError(t.labelNilaiRequired); return; }
    setSaving(true); setError('');
    try {
      const url    = editId ? `/api/admin/social-links/${editId}` : '/api/admin/social-links';
      const method = editId ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }) });
      const json   = (await res.json()) as ApiResponse<SocialLink>;
      if (!res.ok) { setError(json.message ?? json.error ?? t.gagalMenyimpanLink); return; }
      showToast(editId ? t.linkDiperbarui : t.linkDitambah);
      setShowForm(false); setEditId(null);
      void load();
    } catch {
      setError(t.koneksiLinkFailed);
    } finally {
      setSaving(false);
    }
  }

  function askDelete(link: SocialLink) {
    const msg = lang === 'id'
      ? `Link "${link.label}" akan dihapus permanen dari website. Tindakan ini tidak dapat dibatalkan.`
      : `Link "${link.label}" will be permanently deleted from the website. This cannot be undone.`;
    setConfirm({
      open: true, danger: true,
      title: t.hapusSocialTitle, message: msg,
      confirmLabel: t.hapusLinkBtn, loadingLabel: t.menghapusLink,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        setDeleting(link.id);
        try {
          const res  = await fetch(`/api/admin/social-links/${link.id}`, { method: 'DELETE' });
          const json = (await res.json()) as ApiResponse<null>;
          setConfirm(c => ({ ...c, open: false, loading: false }));
          if (!res.ok) { showToast(json.message ?? json.error ?? t.gagalMemuatLink, 'error'); return; }
          showToast(t.linkDihapus);
          await load();
        } catch {
          showToast(t.koneksiFailed, 'error');
        } finally {
          setDeleting(null);
          setConfirm(c => ({ ...c, loading: false }));
        }
      },
    });
  }

  async function toggleActive(link: SocialLink) {
    setToggling(link.id);
    try {
      const res  = await fetch(`/api/admin/social-links/${link.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !link.isActive }) });
      const json = (await res.json()) as ApiResponse<SocialLink>;
      if (!res.ok) { showToast(json.message ?? json.error ?? t.gagalMenyimpanLink, 'error'); return; }
      showToast(link.isActive ? t.linkDinonaktifkan : t.linkDiaktifkan);
      setLinks(c => c.map(item => item.id === link.id ? { ...item, isActive: !link.isActive } : item));
    } catch {
      showToast(t.koneksiFailed, 'error');
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="admin-page">
      <ConfirmModal
        open={confirm.open} title={confirm.title} message={confirm.message}
        confirmLabel={confirm.confirmLabel} loadingLabel={confirm.loadingLabel}
        danger={confirm.danger} loading={confirm.loading}
        onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />

      {toast && (
        <div className="alert" style={{ marginBottom: 16, background: toast.type === 'success' ? '#ecfdf3' : '#fef2f2', border: `1px solid ${toast.type === 'success' ? '#b7e4c7' : '#fecaca'}`, color: toast.type === 'success' ? '#167a3f' : '#dc2626' }}>
          {toast.msg}
        </div>
      )}
      {error && !showForm && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.socialTitle}</h1>
          <p className="admin-subtitle">{t.socialSubtitle}</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreate}>{t.tambahLink}</button>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: 24 }}>
          <h2 className="form-card-title">{editId ? t.editLinkTitle : t.tambahLinkTitle}</h2>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          <form onSubmit={handleSave}>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span className="admin-field-label">{t.platformLabel}</span>
                <select className="control" value={form.platform} onChange={(e) => setForm(f => ({ ...f, platform: e.target.value }))}>
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              <label className="admin-field">
                <span className="admin-field-label">{t.urutanTh}</span>
                <input className="control" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: +e.target.value }))} />
              </label>
            </div>
            <label className="admin-field" style={{ marginTop: 12 }}>
              <span className="admin-field-label">{t.labelField}</span>
              <input className="control" value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} placeholder="WhatsApp Customer Service" required />
            </label>
            <label className="admin-field" style={{ marginTop: 12 }}>
              <span className="admin-field-label">{t.nilaiField}</span>
              <input className="control" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} placeholder={platformHint(form.platform)} required />
              <span style={{ fontSize: 11, color: '#888' }}>{platformHint(form.platform)}</span>
            </label>
            <label className="admin-field" style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <span>{t.tampilWebsite}</span>
            </label>
            <div className="admin-form-actions" style={{ marginTop: 16 }}>
              <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
                {saving ? t.menyimpanLink : t.simpanLink}
              </button>
              <button className="button button-secondary" type="button" onClick={cancelForm} disabled={saving}>{t.batal}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="form-card">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-line" style={{ marginBottom: 12, height: 60 }} />)}
        </div>
      ) : links.length === 0 ? (
        <div className="empty-state surface-card">{t.belumAdaLink}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.urutanTh}</th>
                <th>{t.platformTh}</th>
                <th>{t.labelTh}</th>
                <th>{t.nilaiTh}</th>
                <th>{t.statusTh}</th>
                <th>{t.aksiTh}</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td style={{ width: 60, textAlign: 'center' }}>{link.sortOrder}</td>
                  <td><span className="soft-tag">{platformLabel(link.platform)}</span></td>
                  <td>{link.label}</td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ fontSize: 13 }}>{link.value}</div>
                    {link.normalizedUrl && (
                      <a href={link.normalizedUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--ocean)' }}>
                        {link.normalizedUrl}
                      </a>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      style={{ cursor: 'pointer', background: link.isActive ? 'var(--pale-aqua)' : '#f5f5f5', color: link.isActive ? 'var(--teal)' : '#888', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}
                      onClick={() => toggleActive(link)}
                      disabled={toggling === link.id}
                    >
                      {toggling === link.id ? '...' : link.isActive ? t.aktif : t.nonaktif}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="button button-secondary" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => openEdit(link)} type="button">{t.edit}</button>
                      <button
                        className="button"
                        style={{ padding: '4px 12px', fontSize: 13, background: '#fee2e2', color: '#dc2626', border: 'none' }}
                        onClick={() => askDelete(link)}
                        disabled={deleting === link.id}
                        type="button"
                      >
                        {deleting === link.id ? '...' : t.hapus}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
