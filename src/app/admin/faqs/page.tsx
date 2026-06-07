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
        maxWidth: 420, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-playfair,Georgia,serif)', color: 'var(--teal)', fontSize: 20, marginBottom: 10 }}>
          {title}
        </h3>
        <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className="button button-secondary"
            style={{ minHeight: 40, padding: '8px 18px', fontSize: 13 }}
            onClick={onCancel} type="button" disabled={loading}
          >
            Batal
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
            {loading ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 2000, background: type === 'success' ? 'var(--teal)' : '#dc2626',
      color: 'white', padding: '12px 24px', borderRadius: 12,
      fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      whiteSpace: 'nowrap', pointerEvents: 'none',
    }}>
      {msg}
    </div>
  );
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Faq, 'id'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [pageErr, setPageErr] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string;
    confirmLabel: string; danger?: boolean; loading?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} });

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    setLoading(true);
    setPageErr('');
    try {
      const res = await fetch('/api/admin/faqs', { cache: 'no-store' });
      const json = (await res.json()) as ApiResponse<Faq[]>;
      if (!res.ok) {
        setPageErr(json.message ?? json.error ?? 'Gagal memuat FAQ.');
        setFaqs([]);
        return;
      }
      setFaqs(json.data ?? []);
    } catch {
      setPageErr('Koneksi ke backend FAQ gagal.');
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
    setFormErr('');
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
    setFormErr('');
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setFormErr(''); }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const englishComplete = form.questionEn.trim() && form.answerEn.trim();
    const indonesianComplete = form.questionId.trim() && form.answerId.trim();
    if (!englishComplete && !indonesianComplete) {
      setFormErr('Isi pertanyaan dan jawaban lengkap untuk minimal satu bahasa.');
      return;
    }
    setSaving(true);
    setFormErr('');
    try {
      const res = await fetch(editId ? `/api/admin/faqs/${editId}` : '/api/admin/faqs', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as ApiResponse<Faq>;
      if (!res.ok) {
        setFormErr(json.message ?? json.error ?? 'Gagal menyimpan FAQ.');
        return;
      }
      showToast(editId ? 'FAQ berhasil diperbarui.' : 'FAQ berhasil ditambahkan.');
      setShowForm(false);
      setEditId(null);
      await load();
    } catch {
      setFormErr('Koneksi ke backend FAQ gagal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(faq: Faq) {
    setToggling(faq.id);
    try {
      const res = await fetch(`/api/admin/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      if (res.ok) {
        showToast(faq.isActive ? 'FAQ dinonaktifkan.' : 'FAQ diaktifkan.');
        setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, isActive: !faq.isActive } : f));
      } else {
        showToast('Gagal mengubah status FAQ.', 'error');
      }
    } catch {
      showToast('Koneksi gagal. Coba lagi.', 'error');
    } finally {
      setToggling(null);
    }
  }

  function askDelete(id: string) {
    const faq = faqs.find(f => f.id === id);
    if (!faq) return;
    const question = faq.questionId || faq.questionEn || 'FAQ ini';
    setConfirm({
      open: true,
      danger: true,
      title: 'Hapus FAQ',
      message: `"${question}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        setDeleting(id);
        try {
          const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
          setConfirm(c => ({ ...c, open: false, loading: false }));
          if (res.ok) {
            showToast('FAQ berhasil dihapus.');
            setFaqs(prev => prev.filter(f => f.id !== id));
          } else {
            const json = (await res.json()) as ApiResponse<null>;
            showToast(json.message ?? json.error ?? 'Gagal menghapus FAQ.', 'error');
          }
        } catch {
          setConfirm(c => ({ ...c, open: false, loading: false }));
          showToast('Koneksi gagal. Coba lagi.', 'error');
        } finally {
          setDeleting(null);
        }
      },
    });
  }

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

      {pageErr && !showForm && <div className="alert alert-error" style={{ marginBottom: 16 }}>{pageErr}</div>}

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
        <div className="form-card" style={{ marginBottom: 24, borderLeft: '4px solid var(--teal)' }}>
          <h2 className="form-card-title">{editId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h2>
          {formErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{formErr}</div>}
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
              <input
                type="checkbox" checked={form.isActive}
                onChange={(e) => setForm((value) => ({ ...value, isActive: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--teal)' }}
              />
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
                    <button
                      className={`status-pill${faq.isActive ? '' : ' inactive'}`}
                      type="button"
                      onClick={() => handleToggle(faq)}
                      disabled={toggling === faq.id}
                      style={{ opacity: toggling === faq.id ? 0.6 : 1, cursor: toggling === faq.id ? 'wait' : 'pointer' }}
                    >
                      {toggling === faq.id ? '...' : faq.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="button button-secondary"
                        style={{ padding: '4px 12px', fontSize: 13 }}
                        onClick={() => openEdit(faq)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="button"
                        style={{ padding: '4px 12px', fontSize: 13, background: '#fee2e2', color: '#dc2626', border: 'none' }}
                        onClick={() => askDelete(faq.id)}
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
