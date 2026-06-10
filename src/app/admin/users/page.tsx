'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';

type AdminRole = 'SUPER_ADMIN' | 'ADMIN_OPERASIONAL' | 'CONTENT_ADMIN';
type PermKey = 'booking' | 'treatment' | 'jadwal' | 'areaLayanan' | 'faqKonten' | 'pengaturan' | 'exportData' | 'adminUsers';
type PermEntry = { view: boolean; manage: boolean; delete: boolean };
type PermissionMatrix = Record<PermKey, PermEntry>;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  permissions: PermissionMatrix | null;
  lastLoginAt: string | null;
  createdAt: string;
}

type ApiResponse<T> = { success?: boolean; data?: T; message?: string; error?: string };

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_OPERASIONAL: 'Admin Operasional',
  CONTENT_ADMIN: 'Content Admin',
};

const ROLE_COLORS: Record<AdminRole, { bg: string; color: string }> = {
  SUPER_ADMIN:       { bg: '#fff4ce', color: '#8a5b00' },
  ADMIN_OPERASIONAL: { bg: '#e5f4f6', color: '#276f73' },
  CONTENT_ADMIN:     { bg: '#f0fdf4', color: '#166534' },
};

const PERM_MODULES: { key: PermKey; label: string }[] = [
  { key: 'booking',     label: 'Booking' },
  { key: 'treatment',   label: 'Treatment' },
  { key: 'jadwal',      label: 'Jadwal' },
  { key: 'areaLayanan', label: 'Area Layanan' },
  { key: 'faqKonten',   label: 'FAQ & Konten' },
  { key: 'pengaturan',  label: 'Pengaturan' },
  { key: 'exportData',  label: 'Export Data' },
  { key: 'adminUsers',  label: 'Admin Users' },
];

const DEFAULT_PERMS: Record<AdminRole, PermissionMatrix> = {
  SUPER_ADMIN: {
    booking:     { view: true,  manage: true,  delete: true  },
    treatment:   { view: true,  manage: true,  delete: true  },
    jadwal:      { view: true,  manage: true,  delete: false },
    areaLayanan: { view: true,  manage: true,  delete: true  },
    faqKonten:   { view: true,  manage: true,  delete: true  },
    pengaturan:  { view: true,  manage: true,  delete: false },
    exportData:  { view: true,  manage: true,  delete: false },
    adminUsers:  { view: true,  manage: true,  delete: true  },
  },
  ADMIN_OPERASIONAL: {
    booking:     { view: true,  manage: true,  delete: false },
    treatment:   { view: true,  manage: false, delete: false },
    jadwal:      { view: true,  manage: true,  delete: false },
    areaLayanan: { view: true,  manage: true,  delete: false },
    faqKonten:   { view: false, manage: false, delete: false },
    pengaturan:  { view: false, manage: false, delete: false },
    exportData:  { view: false, manage: false, delete: false },
    adminUsers:  { view: false, manage: false, delete: false },
  },
  CONTENT_ADMIN: {
    booking:     { view: false, manage: false, delete: false },
    treatment:   { view: true,  manage: true,  delete: true  },
    jadwal:      { view: false, manage: false, delete: false },
    areaLayanan: { view: false, manage: false, delete: false },
    faqKonten:   { view: true,  manage: true,  delete: true  },
    pengaturan:  { view: false, manage: false, delete: false },
    exportData:  { view: false, manage: false, delete: false },
    adminUsers:  { view: false, manage: false, delete: false },
  },
};

function formatDateTime(val: string | null) {
  if (!val) return null;
  return new Date(val).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const EMPTY_FORM = {
  name: '', email: '', password: '',
  role: 'ADMIN_OPERASIONAL' as AdminRole,
  isActive: true,
  permissions: DEFAULT_PERMS.ADMIN_OPERASIONAL as PermissionMatrix,
};

/* ── Read-only permissions modal ── */
function PermissionsModal({
  admin, onClose, t,
}: {
  admin: AdminUser;
  onClose: () => void;
  t: Record<string, string>;
}) {
  const perms = admin.permissions ?? DEFAULT_PERMS[admin.role];
  const roleLabel = ROLE_LABELS[admin.role];
  const roleColor = ROLE_COLORS[admin.role];

  return (
    <div
      role="presentation"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-playfair,Georgia,serif)', color: 'var(--teal)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {t.izinTitle} — {admin.name}
            </h3>
            <span style={{ background: roleColor.bg, color: roleColor.color, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
              {roleLabel}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888' }} aria-label="Tutup">×</button>
        </div>

        {admin.permissions === null && (
          <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
            {t.izinDefaultNote ?? 'Menggunakan izin default role.'}
          </p>
        )}

        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(32,82,81,.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--pale-aqua)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--teal)', fontWeight: 700 }}>Modul</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--teal)', fontWeight: 700 }}>{t.lihat}</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--teal)', fontWeight: 700 }}>{t.kelola}</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--teal)', fontWeight: 700 }}>{t.hapusData}</th>
              </tr>
            </thead>
            <tbody>
              {PERM_MODULES.map(m => {
                const p = perms[m.key];
                return (
                  <tr key={m.key} style={{ borderTop: '1px solid #f0ede8' }}>
                    <td style={{ padding: '9px 14px', fontWeight: 600, color: '#333' }}>{m.label}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center' }}>{p.view    ? '✅' : '—'}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center' }}>{p.manage  ? '✅' : '—'}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center' }}>{p.delete  ? '✅' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button type="button" className="button button-secondary" style={{ fontSize: 13, padding: '8px 20px' }} onClick={onClose}>
            {t.batal}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Editable permissions grid (inside form) ── */
function PermissionsEditor({
  perms, role, onChange, t,
}: {
  perms: PermissionMatrix;
  role: AdminRole;
  onChange: (next: PermissionMatrix) => void;
  t: Record<string, string>;
}) {
  const isSuperAdmin = role === 'SUPER_ADMIN';

  function toggle(key: PermKey, col: 'view' | 'manage' | 'delete', checked: boolean) {
    const prev = perms[key];
    const next = { ...prev, [col]: checked };
    if (col === 'view' && !checked) { next.manage = false; next.delete = false; }
    if ((col === 'manage' || col === 'delete') && checked) next.view = true;
    onChange({ ...perms, [key]: next });
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>{t.izinTitle}</span>
        {!isSuperAdmin && (
          <button
            type="button"
            style={{ fontSize: 11, color: 'var(--ocean)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            onClick={() => onChange(DEFAULT_PERMS[role])}
          >
            {t.resetKeDefault ?? 'Reset ke default role'}
          </button>
        )}
      </div>
      {isSuperAdmin && (
        <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{t.superAdminFullAccess ?? 'Super Admin selalu mendapat akses penuh.'}</p>
      )}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(32,82,81,.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--pale-aqua)' }}>
              <th style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--teal)', fontWeight: 700 }}>Modul</th>
              <th style={{ padding: '8px 14px', textAlign: 'center', color: 'var(--teal)', fontWeight: 700 }}>{t.lihat}</th>
              <th style={{ padding: '8px 14px', textAlign: 'center', color: 'var(--teal)', fontWeight: 700 }}>{t.kelola}</th>
              <th style={{ padding: '8px 14px', textAlign: 'center', color: 'var(--teal)', fontWeight: 700 }}>{t.hapusData}</th>
            </tr>
          </thead>
          <tbody>
            {PERM_MODULES.map(m => {
              const p = isSuperAdmin ? DEFAULT_PERMS.SUPER_ADMIN[m.key] : perms[m.key];
              return (
                <tr key={m.key} style={{ borderTop: '1px solid #f0ede8' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: '#333' }}>{m.label}</td>
                  {(['view', 'manage', 'delete'] as const).map(col => (
                    <td key={col} style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={p[col]}
                        disabled={isSuperAdmin}
                        onChange={e => toggle(m.key, col, e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--teal)', cursor: isSuperAdmin ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function AdminUsersPage() {
  const { lang, adminRole } = useAdminLang();
  const t = ADMIN_T[lang];

  const [admins, setAdmins]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formErr, setFormErr]   = useState('');
  const [saving, setSaving]     = useState(false);

  const [confirmOpen, setConfirmOpen]     = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AdminUser | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [permTarget, setPermTarget] = useState<AdminUser | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/admin/users', { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.status === 403) { setError(t.aksesDitolak); setLoading(false); return; }
      const json = (await res.json()) as ApiResponse<AdminUser[]>;
      if (res.ok && json.success) {
        setAdmins(json.data ?? []);
      } else {
        setError(json.message ?? json.error ?? t.gagalMemuatAdmin);
      }
    } catch {
      setError(t.gagalMemuatAdmin);
    } finally {
      setLoading(false);
    }
  }, [t.aksesDitolak, t.gagalMemuatAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAdmins();
  }, [fetchAdmins]);

  if (adminRole !== 'SUPER_ADMIN') {
    return (
      <div className="admin-page">
        <div className="alert alert-error">{t.aksesDitolak}</div>
      </div>
    );
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormErr('');
    setShowForm(true);
  }

  function openEdit(a: AdminUser) {
    setForm({
      name: a.name,
      email: a.email,
      password: '',
      role: a.role,
      isActive: a.isActive,
      permissions: a.permissions ?? DEFAULT_PERMS[a.role],
    });
    setEditId(a.id);
    setFormErr('');
    setShowForm(true);
  }

  function handleRoleChange(newRole: AdminRole) {
    setForm(f => ({ ...f, role: newRole, permissions: DEFAULT_PERMS[newRole] }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormErr('Nama wajib diisi'); return; }
    if (!form.email.trim()) { setFormErr('Email wajib diisi'); return; }
    if (!editId && !form.password.trim()) { setFormErr('Password wajib diisi untuk admin baru'); return; }
    setSaving(true);
    setFormErr('');
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        permissions: form.permissions,
      };
      if (form.password.trim()) body.password = form.password;
      const url    = editId ? `/api/admin/users/${editId}` : '/api/admin/users';
      const method = editId ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json   = (await res.json()) as ApiResponse<AdminUser>;
      if (res.ok && json.success) {
        showToast(editId ? t.adminBerhasilDiperbarui : t.adminBerhasilDibuat);
        setShowForm(false);
        setEditId(null);
        await fetchAdmins();
      } else {
        setFormErr(json.message ?? json.error ?? 'Gagal menyimpan admin.');
      }
    } catch {
      setFormErr('Koneksi ke backend gagal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(a: AdminUser) {
    const newActive = !a.isActive;
    try {
      const res = await fetch(`/api/admin/users/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (res.ok && json.success) {
        showToast(newActive ? t.adminBerhasilDiaktifkan : t.adminBerhasilDinonaktifkan);
        await fetchAdmins();
      } else {
        showToast(json.message ?? json.error ?? 'Gagal.', 'error');
      }
    } catch {
      showToast('Koneksi gagal.', 'error');
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${confirmTarget.id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (res.ok && json.success) {
        showToast(t.adminBerhasilDinonaktifkan);
        setConfirmOpen(false);
        await fetchAdmins();
      } else {
        showToast(json.message ?? json.error ?? 'Gagal.', 'error');
      }
    } catch {
      showToast('Koneksi gagal.', 'error');
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <div className="admin-page wide">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`admin-toast ${toast.type === 'success' ? 'admin-toast--success' : 'admin-toast--error'}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.usersTitle}</h1>
          <p className="admin-subtitle">{t.usersSubtitle}</p>
        </div>
        <button type="button" className="button button-primary" onClick={openCreate}>
          {t.tambahAdmin}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: 24, borderLeft: '4px solid var(--teal)' }}>
          <h2 className="form-card-title">{editId ? t.editAdminTitle : t.tambahAdminBaru}</h2>
          {formErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{formErr}</div>}
          <form onSubmit={handleSave}>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span className="admin-field-label">{t.namaAdminLabel}</span>
                <input className="control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">{t.emailAdminLabel}</span>
                <input className="control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">{editId ? t.passwordBaru : t.passwordLabel}</span>
                <input
                  className="control" type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={!editId}
                  minLength={8}
                  placeholder={editId ? '(kosongkan jika tidak diubah)' : ''}
                />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">{t.roleLabel}</span>
                <select className="control" value={form.role} onChange={e => handleRoleChange(e.target.value as AdminRole)}>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN_OPERASIONAL">Admin Operasional</option>
                  <option value="CONTENT_ADMIN">Content Admin</option>
                </select>
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--teal)' }}
              />
              <span style={{ fontSize: 14 }}>{lang === 'id' ? 'Akun aktif (bisa login)' : 'Account active (can login)'}</span>
            </label>

            {/* Permissions grid */}
            <PermissionsEditor
              perms={form.permissions}
              role={form.role}
              onChange={p => setForm(f => ({ ...f, permissions: p }))}
              t={t}
            />

            <div className="admin-form-actions" style={{ marginTop: 20 }}>
              <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
                {saving ? t.menyimpan : t.simpanAdmin}
              </button>
              <button className="button button-secondary" type="button" onClick={() => { setShowForm(false); setEditId(null); }}>
                {t.batal}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 16 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {admins.map(a => {
            const rc = ROLE_COLORS[a.role];
            return (
              <div key={a.id} style={{
                background: 'white', border: '1px solid rgba(32,82,81,.09)', borderRadius: 18,
                padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
                boxShadow: '0 4px 16px rgba(32,82,81,.06)',
                opacity: a.isActive ? 1 : 0.65,
              }}>
                {/* Avatar */}
                <div style={{
                  flexShrink: 0, width: 44, height: 44, borderRadius: 12,
                  background: a.isActive ? 'var(--teal)' : '#9ca3af', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-playfair,Georgia,serif)', fontSize: 18, fontWeight: 700,
                }}>
                  {a.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <strong style={{ fontSize: 15, color: 'var(--teal)' }}>{a.name}</strong>
                    <span style={{ background: rc.bg, color: rc.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                      {ROLE_LABELS[a.role]}
                    </span>
                    {a.permissions !== null && (
                      <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                        {lang === 'id' ? 'Izin Custom' : 'Custom Perms'}
                      </span>
                    )}
                    {!a.isActive && (
                      <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                        {lang === 'id' ? 'Nonaktif' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#777' }}>{a.email}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                    {t.loginTerakhir}: {formatDateTime(a.lastLoginAt) ?? t.belumPernah}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => setPermTarget(a)}
                  >
                    {t.izinTitle}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => openEdit(a)}
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '6px 12px', fontSize: 12,
                      background: a.isActive ? '#fff0ed' : 'var(--pale-aqua)',
                      color: a.isActive ? '#b33223' : 'var(--teal)',
                      border: `1px solid ${a.isActive ? '#f2b8ae' : 'rgba(32,82,81,.2)'}`,
                      borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                    }}
                    onClick={() => {
                      if (a.isActive) {
                        setConfirmTarget(a);
                        setConfirmOpen(true);
                      } else {
                        void handleToggleActive(a);
                      }
                    }}
                  >
                    {a.isActive ? t.nonaktifkanAdmin : t.aktifkan}
                  </button>
                </div>
              </div>
            );
          })}
          {admins.length === 0 && (
            <div className="surface-card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: 'var(--text-muted)' }}>{lang === 'id' ? 'Belum ada admin.' : 'No admins yet.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Deactivate confirm */}
      {confirmOpen && confirmTarget && (
        <div
          role="presentation"
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmOpen(false); }}
        >
          <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair,Georgia,serif)', color: '#b33223', fontSize: 18, marginBottom: 10 }}>{t.hapusAdminTitle}</h3>
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
              <strong>{confirmTarget.name}</strong> ({confirmTarget.email})
            </p>
            <p style={{ color: '#777', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>{t.hapusAdminPesan}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="button button-secondary" style={{ fontSize: 13, padding: '8px 18px' }} onClick={() => setConfirmOpen(false)} disabled={confirmLoading}>{t.batal}</button>
              <button
                type="button" style={{ padding: '8px 18px', fontSize: 13, background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, opacity: confirmLoading ? 0.7 : 1 }}
                onClick={() => { void handleDelete(); }} disabled={confirmLoading}
              >
                {confirmLoading ? '...' : t.konfirmasiNonaktifkan}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions modal (read-only view) */}
      {permTarget && <PermissionsModal admin={permTarget} onClose={() => setPermTarget(null)} t={t} />}
    </div>
  );
}
