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

/* ─── FAQ Card ─── */
function FaqCard({
  faq, onEdit, onToggle, onDelete, deleting, toggling,
}: {
  faq: Faq;
  onEdit: (f: Faq) => void;
  onToggle: (f: Faq) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
  toggling: string | null;
}) {
  const hasEn = !!(faq.questionEn || faq.answerEn);
  const hasId = !!(faq.questionId || faq.answerId);
  const displayQuestion = faq.questionId || faq.questionEn || '(Pertanyaan belum diisi)';
  const displayAnswer = faq.answerId || faq.answerEn || '';

  return (
    <div style={{
      background: 'white',
      border: `1.5px solid ${faq.isActive ? 'rgba(32,82,81,0.12)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: 18,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      boxShadow: faq.isActive
        ? '0 4px 20px rgba(32,82,81,0.07)'
        : '0 2px 8px rgba(0,0,0,0.04)',
      opacity: faq.isActive ? 1 : 0.75,
      transition: 'box-shadow .2s, opacity .2s',
      position: 'relative',
    }}>
      {/* Sort order badge */}
      <span style={{
        position: 'absolute', top: 14, right: 14,
        background: 'var(--champagne)', color: 'var(--teal)',
        fontSize: 10, fontWeight: 800, padding: '2px 8px',
        borderRadius: 999, letterSpacing: 1,
      }}>
        #{faq.sortOrder}
      </span>

      {/* Question */}
      <div style={{ paddingRight: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: faq.isActive ? '#22c55e' : '#d1d5db',
            flexShrink: 0,
          }} />
          <p style={{
            fontFamily: 'var(--font-playfair,Georgia,serif)',
            fontSize: 15, fontWeight: 700,
            color: faq.isActive ? 'var(--teal)' : '#888',
            lineHeight: 1.4, margin: 0,
          }}>
            {displayQuestion}
          </p>
        </div>
        {displayAnswer && (
          <p style={{
            fontSize: 13, color: '#666', lineHeight: 1.6,
            margin: '0 0 0 16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {displayAnswer}
          </p>
        )}
      </div>

      {/* Language pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: hasId ? 'var(--pale-aqua)' : '#f3f4f6',
          color: hasId ? 'var(--teal)' : '#9ca3af',
          fontSize: 11, fontWeight: 700, padding: '4px 10px',
          borderRadius: 999, letterSpacing: 0.3,
        }}>
          {hasId ? '✓' : '○'} Indonesia
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: hasEn ? 'var(--pale-aqua)' : '#f3f4f6',
          color: hasEn ? 'var(--teal)' : '#9ca3af',
          fontSize: 11, fontWeight: 700, padding: '4px 10px',
          borderRadius: 999, letterSpacing: 0.3,
        }}>
          {hasEn ? '✓' : '○'} English
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          background: faq.isActive ? '#dcfce7' : '#f3f4f6',
          color: faq.isActive ? '#166534' : '#6b7280',
          fontSize: 11, fontWeight: 700, padding: '4px 10px',
          borderRadius: 999, letterSpacing: 0.5,
        }}>
          {faq.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>

      {/* Actions */}
      <div style={{
        borderTop: '1px solid #f0ede8',
        paddingTop: 14, display: 'flex', gap: 7, flexWrap: 'wrap',
      }}>
        <button
          className="button button-secondary"
          style={{ padding: '7px 14px', fontSize: 12, minHeight: 34, flex: '1 1 auto' }}
          onClick={() => onEdit(faq)}
          type="button"
        >
          Edit
        </button>
        <button
          className="button"
          style={{
            padding: '7px 14px', fontSize: 12, minHeight: 34, flex: '1 1 auto',
            background: faq.isActive ? '#fff7ed' : 'var(--pale-aqua)',
            color: faq.isActive ? '#c2410c' : 'var(--teal)',
            border: `1px solid ${faq.isActive ? '#fed7aa' : 'rgba(32,82,81,0.2)'}`,
            opacity: toggling === faq.id ? 0.6 : 1,
          }}
          onClick={() => onToggle(faq)}
          disabled={toggling === faq.id}
          type="button"
        >
          {toggling === faq.id ? '...' : faq.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
        <button
          className="button"
          style={{
            padding: '7px 14px', fontSize: 12, minHeight: 34,
            background: '#fef2f2', color: '#dc2626',
            border: '1px solid #fecaca',
          }}
          onClick={() => onDelete(faq.id)}
          disabled={deleting === faq.id}
          type="button"
        >
          {deleting === faq.id ? '...' : 'Hapus'}
        </button>
      </div>
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      message: `"${question.slice(0, 80)}${question.length > 80 ? '…' : ''}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
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

  const activeCount   = faqs.filter(f => f.isActive).length;
  const inactiveCount = faqs.length - activeCount;

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

      {/* Page header */}
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Kelola FAQ</h1>
          <p className="admin-subtitle">FAQ publik per bahasa. Bahasa yang kosong tidak akan ditampilkan.</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreate}>
          + Tambah FAQ
        </button>
      </div>

      {/* Stats strip */}
      {!loading && faqs.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Total FAQ',  value: faqs.length,    color: 'var(--teal)', bg: 'var(--pale-aqua)' },
            { label: 'Aktif',      value: activeCount,    color: '#166534',     bg: '#dcfce7' },
            { label: 'Nonaktif',   value: inactiveCount,  color: '#6b7280',     bg: '#f3f4f6' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'white', border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 14, padding: '14px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minWidth: 120,
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: 10,
                background: s.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-playfair,Georgia,serif)',
                fontSize: 18, fontWeight: 700, color: s.color,
              }}>
                {s.value}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: 28, borderLeft: '4px solid var(--teal)' }}>
          <h2 className="form-card-title">{editId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h2>
          {formErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{formErr}</div>}
          <form onSubmit={handleSave}>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span className="admin-field-label">Pertanyaan (Indonesia)</span>
                <input className="control" value={form.questionId} onChange={(e) => setForm(v => ({ ...v, questionId: e.target.value }))} placeholder="Berapa lama proses IV therapy?" />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Question (English)</span>
                <input className="control" value={form.questionEn} onChange={(e) => setForm(v => ({ ...v, questionEn: e.target.value }))} placeholder="How long does IV therapy take?" />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Jawaban (Indonesia)</span>
                <textarea className="control" rows={4} value={form.answerId} onChange={(e) => setForm(v => ({ ...v, answerId: e.target.value }))} placeholder="Proses IV therapy biasanya..." />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Answer (English)</span>
                <textarea className="control" rows={4} value={form.answerEn} onChange={(e) => setForm(v => ({ ...v, answerEn: e.target.value }))} placeholder="IV therapy usually takes..." />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Urutan Tampil</span>
                <input className="control" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm(v => ({ ...v, sortOrder: Number(e.target.value) }))} />
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(v => ({ ...v, isActive: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--teal)' }}
              />
              <span style={{ fontSize: 14, color: 'var(--text)' }}>Tampilkan di halaman publik</span>
            </label>
            <div className="admin-form-actions" style={{ marginTop: 20 }}>
              <button
                className={`button button-primary${saving ? ' loading' : ''}`}
                type="submit" disabled={saving}
              >
                {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah FAQ'}
              </button>
              <button className="button button-secondary" type="button" onClick={cancelForm} disabled={saving}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 18 }} />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Belum ada FAQ. Klik &ldquo;+ Tambah FAQ&rdquo; untuk menambahkan.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {faqs.map(faq => (
            <FaqCard
              key={faq.id}
              faq={faq}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={askDelete}
              deleting={deleting}
              toggling={toggling}
            />
          ))}
        </div>
      )}
    </div>
  );
}
