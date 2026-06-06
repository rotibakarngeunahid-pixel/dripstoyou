'use client';

import { useEffect, useState } from 'react';

type LegalSummary = {
  id: string;
  type: string;
  title: string;
  slug: string;
  isPublished: boolean;
  updatedAt: string;
};

type LegalFull = LegalSummary & { content: string };

type ApiResponse<T> = { data?: T; error?: string };

const TYPE_LABEL: Record<string, string> = {
  PRIVACY_POLICY: 'Kebijakan Privasi',
  TERMS_CONDITIONS: 'Syarat & Ketentuan',
  MEDICAL_DISCLAIMER: 'Disclaimer Medis',
};

export default function AdminLegalPage() {
  const [pages, setPages] = useState<LegalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LegalFull | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/legal');
      const json = (await res.json()) as ApiResponse<LegalSummary[]>;
      setPages(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function openEdit(id: string) {
    setLoadingEdit(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/legal/${id}`);
      const json = (await res.json()) as ApiResponse<LegalFull>;
      if (json.data) setEditing(json.data);
    } finally {
      setLoadingEdit(false);
    }
  }

  function cancelEdit() {
    setEditing(null);
    setError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.content.trim()) { setError('Konten tidak boleh kosong.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/legal/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editing.title, content: editing.content, isPublished: editing.isPublished }),
      });
      const json = (await res.json()) as ApiResponse<LegalFull>;
      if (!res.ok) { setError(json.error ?? 'Gagal menyimpan.'); return; }
      showToast('Halaman legal berhasil diperbarui.');
      setEditing(null);
      void load();
    } finally {
      setSaving(false);
    }
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
          <h1 className="admin-title">Kelola Halaman Legal</h1>
          <p className="admin-subtitle">Privasi, Syarat & Ketentuan, dan Disclaimer Medis.</p>
        </div>
      </div>

      {editing ? (
        <div className="form-card">
          <h2 className="form-card-title">Edit: {TYPE_LABEL[editing.type] ?? editing.type}</h2>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          <form onSubmit={handleSave}>
            <label className="admin-field">
              <span className="admin-field-label">Judul Halaman</span>
              <input
                className="control"
                value={editing.title}
                onChange={(e) => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)}
                required
              />
            </label>
            <label className="admin-field" style={{ marginTop: 12 }}>
              <span className="admin-field-label">Konten *</span>
              <textarea
                className="control"
                rows={20}
                style={{ fontFamily: 'monospace', fontSize: 13 }}
                value={editing.content}
                onChange={(e) => setEditing(ed => ed ? { ...ed, content: e.target.value } : ed)}
                placeholder="Tulis konten halaman legal di sini..."
                required
              />
              <span style={{ fontSize: 11, color: '#888' }}>Mendukung teks biasa. Gunakan baris kosong untuk memisahkan paragraf.</span>
            </label>
            <label className="admin-field" style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={editing.isPublished}
                onChange={(e) => setEditing(ed => ed ? { ...ed, isPublished: e.target.checked } : ed)}
              />
              <span>Publikasikan halaman</span>
            </label>
            <div className="admin-form-actions" style={{ marginTop: 16 }}>
              <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button className="button button-secondary" type="button" onClick={cancelEdit} disabled={saving}>
                Batal
              </button>
              <a
                href={`/legal/${editing.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-secondary"
                style={{ marginLeft: 'auto' }}
              >
                Lihat di publik ↗
              </a>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div className="form-card">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-line" style={{ marginBottom: 12, height: 60 }} />)}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Halaman</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Terakhir Diubah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <strong>{page.title}</strong>
                    <div style={{ fontSize: 11, color: '#888' }}>{TYPE_LABEL[page.type] ?? page.type}</div>
                  </td>
                  <td><code style={{ fontSize: 12 }}>/legal/{page.slug}</code></td>
                  <td>
                    <span style={{ background: page.isPublished ? 'var(--pale-aqua)' : '#f5f5f5', color: page.isPublished ? 'var(--teal)' : '#888', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>
                      {page.isPublished ? 'Dipublikasikan' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: '#666' }}>
                    {new Date(page.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="button button-primary"
                        style={{ padding: '4px 14px', fontSize: 13 }}
                        onClick={() => openEdit(page.id)}
                        disabled={loadingEdit}
                        type="button"
                      >
                        {loadingEdit ? '...' : 'Edit Konten'}
                      </button>
                      <a href={`/legal/${page.slug}`} target="_blank" rel="noopener noreferrer" className="button button-secondary" style={{ padding: '4px 12px', fontSize: 13 }}>
                        Preview ↗
                      </a>
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
