'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { adminMutate } from '@/lib/admin-mutate';

export interface AdminBlogCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  is_active: boolean;
  post_count: number;
}

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: '', slug: '', description: '', metaTitle: '', metaDescription: '', sortOrder: '0', isActive: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160);
}

export default function BlogCategoriesClient({ categories }: { categories: AdminBlogCategoryRow[] }) {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminBlogCategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEdit = !!draft.id;

  function startEdit(cat: AdminBlogCategoryRow) {
    setError('');
    setDraft({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      metaTitle: cat.meta_title ?? '',
      metaDescription: cat.meta_description ?? '',
      sortOrder: String(cat.sort_order),
      isActive: cat.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      name: draft.name,
      slug: draft.slug || slugify(draft.name),
      description: draft.description,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      sortOrder: Number.parseInt(draft.sortOrder, 10) || 0,
      isActive: draft.isActive,
    };

    const res = isEdit
      ? await adminMutate(`/api/admin/blog-categories/${draft.id}`, 'PATCH', payload)
      : await adminMutate('/api/admin/blog-categories', 'POST', payload);
    setSaving(false);

    if (!res.ok) {
      setError(res.error ?? t.gagalMenyimpan);
      return;
    }
    setDraft(EMPTY_DRAFT);
    setNotice(t.kategoriBerhasilDisimpan);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await adminMutate(`/api/admin/blog-categories/${deleteTarget.id}`, 'DELETE');
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.ok) {
      setError(res.error ?? t.gagalMenyimpan);
      return;
    }
    setNotice(t.kategoriBerhasilDihapus);
    router.refresh();
  }

  return (
    <div className="admin-page">
      <ConfirmModal
        open={!!deleteTarget}
        danger
        title={t.hapusKategoriTitle}
        message={`${deleteTarget?.name ?? ''} — ${t.hapusKategoriPesan}`}
        confirmLabel={t.hapus}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.kategoriBlogTitle}</h1>
          <p className="admin-subtitle">{t.kategoriBlogSubtitle}</p>
        </div>
        <Link href="/admin/blog" className="button button-secondary">{t.kembali}</Link>
      </div>

      {notice && <div className="alert alert-success" style={{ marginBottom: 16 }}>{notice}</div>}

      <section className="form-card" style={{ marginBottom: 24 }}>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">{t.namaKategori}</span>
              <input
                className="control"
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setDraft((d) => ({ ...d, name, slug: isEdit ? d.slug : slugify(name) }));
                }}
                maxLength={120}
                required
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">{t.slugKategori}</span>
              <input
                className="control"
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: slugify(e.target.value) }))}
                maxLength={160}
                required
              />
              <span className="admin-help">/blog/kategori/{draft.slug || '…'}</span>
            </label>
          </div>

          <label className="admin-field">
            <span className="admin-field-label">{t.deskripsiKategori}</span>
            <textarea
              className="control"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={2}
              maxLength={500}
            />
          </label>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">{t.metaTitleLabel}</span>
              <input
                className="control"
                value={draft.metaTitle}
                onChange={(e) => setDraft((d) => ({ ...d, metaTitle: e.target.value }))}
                maxLength={70}
              />
              <span className="admin-help">{draft.metaTitle.length}/60 {t.karakterSuffix}</span>
            </label>
            <label className="admin-field">
              <span className="admin-field-label">{t.metaDescLabel}</span>
              <input
                className="control"
                value={draft.metaDescription}
                onChange={(e) => setDraft((d) => ({ ...d, metaDescription: e.target.value }))}
                maxLength={200}
              />
              <span className="admin-help">{draft.metaDescription.length}/160 {t.karakterSuffix}</span>
            </label>
          </div>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">{t.urutanKategori}</span>
              <input
                className="control"
                type="number"
                min="0"
                value={draft.sortOrder}
                onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
              />
            </label>
            <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
                style={{ width: 16, height: 16 }}
              />
              <span className="admin-field-label">{t.aktifLabel}</span>
            </label>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="admin-form-actions">
            <button className={`button button-primary${saving ? ' loading' : ''}`} type="submit" disabled={saving}>
              {saving ? t.menyimpan : isEdit ? t.simpanPerubahan : t.tambahKategoriBtn}
            </button>
            {isEdit && (
              <button className="button button-secondary" type="button" onClick={() => setDraft(EMPTY_DRAFT)} disabled={saving}>
                {t.batal}
              </button>
            )}
          </div>
        </form>
      </section>

      <div className="admin-list">
        {categories.map((cat) => (
          <article className="admin-list-item surface-card" key={cat.id}>
            <div>
              <div className="admin-list-title-row">
                <h2 className="admin-list-title">{cat.name}</h2>
                <span
                  className="status-pill"
                  style={{
                    color: cat.is_active ? '#1b8f4d' : '#c0392b',
                    background: cat.is_active ? 'rgba(27,143,77,.12)' : 'rgba(192,57,43,.12)',
                  }}
                >
                  {cat.is_active ? t.aktif : t.nonaktif}
                </span>
              </div>
              {cat.description && <p className="admin-list-desc">{cat.description}</p>}
              <div className="admin-list-meta">
                <span>/blog/kategori/{cat.slug}</span>
                <span>{cat.post_count} {t.artikelSuffix}</span>
                <span>{t.urutanKategori}: {cat.sort_order}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <button type="button" className="button button-secondary" onClick={() => startEdit(cat)}>
                {t.edit}
              </button>
              <button
                type="button"
                className="button button-secondary"
                style={{ color: '#c0392b', borderColor: 'rgba(192,57,43,.35)' }}
                onClick={() => setDeleteTarget(cat)}
              >
                {t.hapus}
              </button>
            </div>
          </article>
        ))}

        {categories.length === 0 && (
          <div className="empty-state surface-card">{t.belumAdaKategoriBlog}</div>
        )}
      </div>
    </div>
  );
}
