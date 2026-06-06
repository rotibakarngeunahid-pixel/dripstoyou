'use client';

import { useEffect, useState } from 'react';

type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

type ApiResponse<T> = { data?: T; error?: string; success?: boolean };

const CATEGORIES = ['General', 'Booking', 'Payment', 'Treatment', 'Coverage'];
const EMPTY: Omit<Faq, 'id'> = { category: 'General', question: '', answer: '', sortOrder: 0, isActive: true };

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Faq, 'id'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faqs');
      const json = (await res.json()) as ApiResponse<Faq[]>;
      setFaqs(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  function openCreate() {
    setForm(EMPTY);
    setEditId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(faq: Faq) {
    setForm({ category: faq.category, question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isActive: faq.isActive });
    setEditId(faq.id);
    setError('');
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      setError('Pertanyaan dan jawaban wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/admin/faqs/${editId}` : '/api/admin/faqs';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as ApiResponse<Faq>;
      if (!res.ok) { setError(json.error ?? 'Gagal menyimpan.'); return; }
      showToast(editId ? 'FAQ berhasil diperbarui.' : 'FAQ berhasil ditambahkan.');
      setShowForm(false);
      setEditId(null);
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus FAQ ini?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      if (!res.ok) { showToast('Gagal menghapus FAQ.'); return; }
      showToast('FAQ dihapus.');
      void load();
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(faq: Faq) {
    await fetch(`/api/admin/faqs/${faq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !faq.isActive }),
    });
    void load();
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
          <h1 className="admin-title">Kelola FAQ</h1>
          <p className="admin-subtitle">Pertanyaan umum yang ditampilkan di halaman publik.</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreate}>
          + Tambah FAQ
        </button>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: 24 }}>
          <h2 className="form-card-title">{editId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h2>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          <form onSubmit={handleSave}>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span className="admin-field-label">Kategori</span>
                <select className="control" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Urutan</span>
                <input className="control" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: +e.target.value }))} />
              </label>
            </div>
            <label className="admin-field" style={{ marginTop: 12 }}>
              <span className="admin-field-label">Pertanyaan *</span>
              <input className="control" value={form.question} onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Apa saja yang perlu saya persiapkan?" required />
            </label>
            <label className="admin-field" style={{ marginTop: 12 }}>
              <span className="admin-field-label">Jawaban *</span>
              <textarea className="control" rows={4} value={form.answer} onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Tulis jawaban lengkap..." required />
            </label>
            <label className="admin-field" style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <span>Tampilkan di publik</span>
            </label>
            <div className="admin-form-actions" style={{ marginTop: 16 }}>
              <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button className="button button-secondary" type="button" onClick={cancelForm} disabled={saving}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="form-card">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-line" style={{ marginBottom: 12, height: 60 }} />)}
        </div>
      ) : faqs.length === 0 ? (
        <div className="empty-state surface-card">
          Belum ada FAQ. Klik &quot;+ Tambah FAQ&quot; untuk menambahkan.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Urutan</th>
                <th>Kategori</th>
                <th>Pertanyaan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id}>
                  <td style={{ width: 60, textAlign: 'center' }}>{faq.sortOrder}</td>
                  <td><span className="soft-tag">{faq.category}</span></td>
                  <td style={{ maxWidth: 360 }}>{faq.question}</td>
                  <td>
                    <button
                      className={`status-pill${faq.isActive ? '' : ' inactive'}`}
                      style={{ cursor: 'pointer', background: faq.isActive ? 'var(--pale-aqua)' : '#f5f5f5', color: faq.isActive ? 'var(--teal)' : '#888', border: 'none' }}
                      onClick={() => toggleActive(faq)}
                      type="button"
                    >
                      {faq.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="button button-secondary" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => openEdit(faq)} type="button">Edit</button>
                      <button
                        className="button"
                        style={{ padding: '4px 12px', fontSize: 13, background: '#fee2e2', color: '#dc2626', border: 'none' }}
                        onClick={() => handleDelete(faq.id)}
                        disabled={deleting === faq.id}
                        type="button"
                      >
                        {deleting === faq.id ? '...' : 'Hapus'}
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
