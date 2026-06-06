'use client';

import { useEffect, useState } from 'react';

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

type ApiResponse<T> = { data?: T; error?: string; success?: boolean };

const EMPTY = { name: '', slug: '', isActive: true, estimatedArrivalMinutes: '' as string | number, extraFeeAmount: '' as string | number, note: '', sortOrder: 0 };

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function AdminCoveragePage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
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
      const res = await fetch('/api/admin/coverage');
      const json = (await res.json()) as ApiResponse<Area[]>;
      setAreas(json.data ?? []);
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

  function openEdit(area: Area) {
    setForm({
      name: area.name,
      slug: area.slug,
      isActive: area.isActive,
      estimatedArrivalMinutes: area.estimatedArrivalMinutes ?? '',
      extraFeeAmount: area.extraFeeAmount ?? '',
      note: area.note ?? '',
      sortOrder: area.sortOrder,
    });
    setEditId(area.id);
    setError('');
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setError('');
  }

  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, ...(editId ? {} : { slug: toSlug(name) }) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Nama dan slug wajib diisi.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      setError('Slug hanya boleh mengandung huruf kecil, angka, dan tanda minus.');
      return;
    }
    setSaving(true);
    setError('');
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      isActive: form.isActive,
      estimatedArrivalMinutes: form.estimatedArrivalMinutes !== '' ? Number(form.estimatedArrivalMinutes) : null,
      extraFeeAmount: form.extraFeeAmount !== '' ? Number(form.extraFeeAmount) : null,
      note: form.note || null,
      sortOrder: Number(form.sortOrder),
    };
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/admin/coverage/${editId}` : '/api/admin/coverage';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ApiResponse<Area>;
      if (!res.ok) { setError(json.error ?? 'Gagal menyimpan.'); return; }
      showToast(editId ? 'Area berhasil diperbarui.' : 'Area berhasil ditambahkan.');
      setShowForm(false);
      setEditId(null);
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Nonaktifkan area ini?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/coverage/${id}`, { method: 'DELETE' });
      if (!res.ok) { showToast('Gagal menonaktifkan area.'); return; }
      showToast('Area dinonaktifkan.');
      void load();
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(area: Area) {
    await fetch(`/api/admin/coverage/${area.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !area.isActive }),
    });
    void load();
  }

  function formatFee(amount: number | null) {
    if (amount === null) return '—';
    if (amount === 0) return 'Gratis';
    return `Rp ${amount.toLocaleString('id-ID')}`;
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
          <h1 className="admin-title">Kelola Area Layanan</h1>
          <p className="admin-subtitle">Daftar area yang bisa dilayani oleh DRIP TO YOU.</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreate}>
          + Tambah Area
        </button>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: 24 }}>
          <h2 className="form-card-title">{editId ? 'Edit Area' : 'Tambah Area Baru'}</h2>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          <form onSubmit={handleSave}>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span className="admin-field-label">Nama Area *</span>
                <input className="control" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Seminyak" required />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Slug *</span>
                <input className="control" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="seminyak" required />
                <span style={{ fontSize: 11, color: '#888' }}>Hanya huruf kecil, angka, minus</span>
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Estimasi Tiba (menit)</span>
                <input className="control" type="number" min={1} value={form.estimatedArrivalMinutes} onChange={(e) => setForm(f => ({ ...f, estimatedArrivalMinutes: e.target.value }))} placeholder="30" />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Biaya Tambahan (Rp)</span>
                <input className="control" type="number" min={0} step={1000} value={form.extraFeeAmount} onChange={(e) => setForm(f => ({ ...f, extraFeeAmount: e.target.value }))} placeholder="0" />
              </label>
              <label className="admin-field">
                <span className="admin-field-label">Urutan</span>
                <input className="control" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: +e.target.value }))} />
              </label>
            </div>
            <label className="admin-field" style={{ marginTop: 12 }}>
              <span className="admin-field-label">Catatan</span>
              <input className="control" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Hanya area Seminyak dalam (bukan Legian)" />
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
      ) : areas.length === 0 ? (
        <div className="empty-state surface-card">
          Belum ada area layanan. Klik &quot;+ Tambah Area&quot; untuk menambahkan.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Urutan</th>
                <th>Nama Area</th>
                <th>Slug</th>
                <th>Tiba (menit)</th>
                <th>Biaya Tambahan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.id}>
                  <td style={{ width: 60, textAlign: 'center' }}>{area.sortOrder}</td>
                  <td>
                    <strong>{area.name}</strong>
                    {area.note && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{area.note}</div>}
                  </td>
                  <td><code style={{ fontSize: 12 }}>{area.slug}</code></td>
                  <td style={{ textAlign: 'center' }}>{area.estimatedArrivalMinutes ?? '—'}</td>
                  <td>{formatFee(area.extraFeeAmount)}</td>
                  <td>
                    <button
                      type="button"
                      style={{ cursor: 'pointer', background: area.isActive ? 'var(--pale-aqua)' : '#f5f5f5', color: area.isActive ? 'var(--teal)' : '#888', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}
                      onClick={() => toggleActive(area)}
                    >
                      {area.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="button button-secondary" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => openEdit(area)} type="button">Edit</button>
                      <button
                        className="button"
                        style={{ padding: '4px 12px', fontSize: 13, background: '#fee2e2', color: '#dc2626', border: 'none' }}
                        onClick={() => handleDeactivate(area.id)}
                        disabled={deleting === area.id}
                        type="button"
                      >
                        {deleting === area.id ? '...' : 'Nonaktifkan'}
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
