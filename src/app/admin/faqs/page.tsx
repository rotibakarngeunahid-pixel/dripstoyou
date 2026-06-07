'use client';

import { useEffect, useState } from 'react';

type Faq = {
  id: string;
  questionEn: string;
  answerEn: string;
  questionId: string;
  answerId: string;
  sortOrder: number;
  isActive: boolean;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

const EMPTY: Omit<Faq, 'id'> = {
  questionEn: '',
  answerEn: '',
  questionId: '',
  answerId: '',
  sortOrder: 0,
  isActive: true,
};

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

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/faqs', { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<Faq[]>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Gagal memuat FAQ.');
        setFaqs([]);
        return;
      }
      setFaqs(json.data ?? []);
    } catch {
      setError('Koneksi ke backend FAQ gagal.');
      setFaqs([]);
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
    setForm({
      questionEn: faq.questionEn,
      answerEn: faq.answerEn,
      questionId: faq.questionId,
      answerId: faq.answerId,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
    });
    setEditId(faq.id);
    setError('');
    setShowForm(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const englishComplete = form.questionEn.trim() && form.answerEn.trim();
    const indonesianComplete = form.questionId.trim() && form.answerId.trim();
    if (!englishComplete && !indonesianComplete) {
      setError('Isi pertanyaan dan jawaban lengkap untuk minimal satu bahasa.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(editId ? `/api/admin/faqs/${editId}` : '/api/admin/faqs', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as ApiResponse<Faq>;
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Gagal menyimpan FAQ.');
        return;
      }
      showToast(editId ? 'FAQ berhasil diperbarui.' : 'FAQ berhasil ditambahkan.');
      setShowForm(false);
      setEditId(null);
      await load();
    } catch {
      setError('Koneksi ke backend FAQ gagal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus FAQ ini?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<null>;
      if (!res.ok) {
        showToast(json.message ?? json.error ?? 'Gagal menghapus FAQ.');
        return;
      }
      showToast('FAQ berhasil dihapus.');
      await load();
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(faq: Faq) {
    const res = await fetch(`/api/admin/faqs/${faq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !faq.isActive }),
    });
    if (!res.ok) {
      showToast('Gagal mengubah status FAQ.');
      return;
    }
    await load();
  }

  return (
    <div className="admin-page">
      {toast && <div className="alert alert-success" style={{ marginBottom: 16 }}>{toast}</div>}
      {error && !showForm && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Kelola FAQ</h1>
          <p className="admin-subtitle">FAQ publik per bahasa. Bahasa yang kosong tidak akan ditampilkan.</p>
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
                <span className="admin-field-label">Question (English)</span>
                <input className="control" value={form.questionEn} onChange={(e) => setForm((value) => ({ ...value, questionEn: e.target.value }))} />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Pertanyaan (Indonesia)</span>
                <input className="control" value={form.questionId} onChange={(e) => setForm((value) => ({ ...value, questionId: e.target.value }))} />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Answer (English)</span>
                <textarea className="control" rows={5} value={form.answerEn} onChange={(e) => setForm((value) => ({ ...value, answerEn: e.target.value }))} />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Jawaban (Indonesia)</span>
                <textarea className="control" rows={5} value={form.answerId} onChange={(e) => setForm((value) => ({ ...value, answerId: e.target.value }))} />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Urutan</span>
                <input className="control" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((value) => ({ ...value, sortOrder: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="admin-field" style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((value) => ({ ...value, isActive: e.target.checked }))} />
              <span>Tampilkan di publik</span>
            </label>
            <div className="admin-form-actions" style={{ marginTop: 16 }}>
              <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button className="button button-secondary" type="button" onClick={() => setShowForm(false)} disabled={saving}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="form-card">
          {[1, 2, 3].map((item) => <div key={item} className="skeleton-line" style={{ marginBottom: 12, height: 60 }} />)}
        </div>
      ) : faqs.length === 0 ? (
        <div className="empty-state surface-card">
          Belum ada FAQ. Halaman publik akan menampilkan kondisi kosong.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Urutan</th>
                <th>English</th>
                <th>Indonesia</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id}>
                  <td style={{ width: 60, textAlign: 'center' }}>{faq.sortOrder}</td>
                  <td>{faq.questionEn || <span className="muted-small">Belum diisi</span>}</td>
                  <td>{faq.questionId || <span className="muted-small">Belum diisi</span>}</td>
                  <td>
                    <button className={`status-pill${faq.isActive ? '' : ' inactive'}`} type="button" onClick={() => toggleActive(faq)}>
                      {faq.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="button button-secondary" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => openEdit(faq)} type="button">Edit</button>
                      <button className="button" style={{ padding: '4px 12px', fontSize: 13, background: '#fee2e2', color: '#dc2626', border: 'none' }} onClick={() => handleDelete(faq.id)} disabled={deleting === faq.id} type="button">
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
