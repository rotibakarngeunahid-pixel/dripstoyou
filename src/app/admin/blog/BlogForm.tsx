'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { adminMutate } from '@/lib/admin-mutate';
import { estimateReadingMinutes, renderMarkdown } from '@/lib/markdown';
import { BLOG_STATUSES, type BlogStatus } from '@/lib/blog-status';

export interface AdminBlogCategory {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  post_count?: number;
}

export interface AdminBlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  content_source: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  author_name: string | null;
  category_id: string | null;
  status: BlogStatus;
  published_at: string | null;
}

type UploadResponse = { success?: boolean; data?: { publicUrl: string }; error?: string };

const META_TITLE_TARGET = 60;
const META_DESC_TARGET = 160;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

// "2026-07-24 09:00:00" (dari PHP) ↔ "2026-07-24T09:00" (input datetime-local)
function toLocalInput(value: string | null): string {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div role="status" aria-live="polite" className={`admin-toast ${type === 'success' ? 'admin-toast--success' : 'admin-toast--error'}`}>
      {msg}
    </div>
  );
}

/* ─── Counter karakter untuk field SEO ─── */
function CharCounter({ value, target, suffix, overLabel }: { value: string; target: number; suffix: string; overLabel: string }) {
  const over = value.length > target;
  return (
    <span className="admin-help" style={{ color: over ? '#c0392b' : undefined }}>
      {value.length}/{target} {suffix}{over ? ` — ${overLabel}` : ''}
    </span>
  );
}

/* ─── Upload cover (folder uploads/blog) ─── */
function CoverUpload({
  currentUrl, onUploaded, onUploadingChange, t,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
  onUploadingChange: (uploading: boolean) => void;
  t: Record<string, string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFile(file: File) {
    setUploadError('');
    setUploading(true);
    onUploadingChange(true);
    const form = new FormData();
    form.append('file', file);
    form.append('type', 'blog');
    try {
      const res = await fetch('/api/admin/uploads', { method: 'POST', body: form });
      const data = (await res.json()) as UploadResponse;
      if (!res.ok || !data.success || !data.data) {
        setUploadError(data.error ?? t.uploadGagal);
        return;
      }
      onUploaded(data.data.publicUrl);
    } catch {
      setUploadError(t.koneksiGagal);
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  if (currentUrl) {
    return (
      <div className="upload-preview-wrap">
        <div className="upload-preview-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="" />
        </div>
        <div className="upload-preview-actions">
          <button type="button" className="button button-secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? t.mengunggahGambar : t.gantiFoto}
          </button>
          <button
            type="button"
            className="button"
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
            onClick={() => onUploaded('')}
            disabled={uploading}
          >
            {t.hapusFoto}
          </button>
        </div>
        {uploadError && <div className="alert alert-error" style={{ marginTop: 8 }}>{uploadError}</div>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInputChange} style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <div
      className={`upload-dropzone${uploading ? ' uploading' : ''}`}
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onDragOver={(e) => e.preventDefault()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      aria-label={t.coverArtikel}
    >
      {uploading ? (
        <><div className="upload-spinner" aria-hidden="true" /><span className="upload-hint">{t.mengunggahGambar}</span></>
      ) : (
        <>
          <span className="upload-label">{t.pilihGambar}</span>
          <span className="upload-hint">{t.infoUpload}</span>
        </>
      )}
      {uploadError && <div className="alert alert-error" style={{ marginTop: 8 }}>{uploadError}</div>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInputChange} style={{ display: 'none' }} disabled={uploading} />
    </div>
  );
}

/* ─── Form utama ─── */
export default function BlogForm({
  post,
  categories,
}: {
  post?: AdminBlogPostDetail;
  categories: AdminBlogCategory[];
}) {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];
  const router = useRouter();
  const isEdit = !!post?.id;

  // Slug permanen setelah artikel pernah tayang (§8.1) — cegah link rot.
  const slugLocked = isEdit && (post!.status === 'published' || post!.status === 'archived' || !!post!.published_at);

  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [categoryId, setCategoryId] = useState(post?.category_id ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [body, setBody] = useState(post?.content_source ?? '');
  const [coverUrl, setCoverUrl] = useState(post?.cover_image_url ?? '');
  const [coverAlt, setCoverAlt] = useState(post?.cover_image_alt ?? '');
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? '');
  const [metaDesc, setMetaDesc] = useState(post?.meta_description ?? '');
  const [canonical, setCanonical] = useState(post?.canonical_url ?? '');
  const [ogImage, setOgImage] = useState(post?.og_image_url ?? '');
  const [authorName, setAuthorName] = useState(post?.author_name ?? '');
  const [status, setStatus] = useState<BlogStatus>(post?.status ?? 'draft');
  const [publishedAt, setPublishedAt] = useState(toLocalInput(post?.published_at ?? null));

  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const effectiveSlug = slugTouched || isEdit ? slug : slugify(title);
  const previewHtml = useMemo(() => (showPreview ? renderMarkdown(body) : ''), [showPreview, body]);
  const readingMinutes = useMemo(() => estimateReadingMinutes(body), [body]);

  const statusLabels: Record<BlogStatus, string> = {
    draft: t.statusDraft,
    scheduled: t.statusScheduled,
    published: t.statusPublished,
    archived: t.statusArchived,
  };

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (coverUrl && !coverAlt.trim()) {
      setError(lang === 'id'
        ? 'Alt text cover wajib diisi bila ada gambar cover.'
        : 'Cover alt text is required when a cover image is set.');
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      title,
      categoryId: categoryId || '',
      excerpt,
      contentSource: body,
      coverImageUrl: coverUrl,
      coverImageAlt: coverAlt,
      metaTitle,
      metaDescription: metaDesc,
      canonicalUrl: canonical,
      ogImageUrl: ogImage,
      authorName,
      status,
      publishedAt,
    };
    // Slug hanya dikirim saat masih boleh diubah — server juga menolak perubahan
    // setelah artikel pernah tayang.
    if (!slugLocked) payload.slug = effectiveSlug;

    const res = isEdit
      ? await adminMutate(`/api/admin/blog/${post!.id}`, 'PATCH', payload)
      : await adminMutate('/api/admin/blog', 'POST', payload);
    setSaving(false);

    if (!res.ok) {
      setError(res.error ?? t.gagalMenyimpanArtikel);
      showToast(res.error ?? t.gagalMenyimpanArtikel, 'error');
      return;
    }

    showToast(isEdit ? t.artikelBerhasilDiperbarui : t.artikelBerhasilDibuat);
    setTimeout(() => { router.push('/admin/blog'); router.refresh(); }, 700);
  }

  async function handleDelete() {
    if (!post?.id) return;
    setDeleting(true);
    const res = await adminMutate(`/api/admin/blog/${post.id}`, 'DELETE');
    setDeleting(false);
    setConfirmOpen(false);
    if (!res.ok) {
      setError(res.error ?? t.gagalMenyimpanArtikel);
      showToast(res.error ?? t.gagalMenyimpanArtikel, 'error');
      return;
    }
    showToast(t.artikelBerhasilDihapus);
    setTimeout(() => { router.push('/admin/blog'); router.refresh(); }, 700);
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <ConfirmModal
        open={confirmOpen}
        danger
        title={t.hapusArtikelTitle}
        message={lang === 'id'
          ? `Artikel "${title}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
          : `Article "${title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel={t.hapus}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        <label className="admin-field">
          <span className="admin-field-label">{t.judulArtikel}</span>
          <input
            className="control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </label>

        <label className="admin-field">
          <span className="admin-field-label">{t.slugArtikel}</span>
          <input
            className="control"
            value={effectiveSlug}
            onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
            disabled={slugLocked}
            maxLength={200}
            required
          />
          <span className="admin-help">{slugLocked ? t.slugTerkunci : t.slugHelp}</span>
          <span className="admin-help">dripstoyou.com/blog/{effectiveSlug || '…'}</span>
        </label>

        <div className="admin-form-grid">
          <label className="admin-field">
            <span className="admin-field-label">{t.kategoriArtikel}</span>
            <select className="control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t.tanpaKategori}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}{cat.is_active ? '' : ' (nonaktif)'}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-field-label">{t.authorLabel}</span>
            <input
              className="control"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={120}
              placeholder="Drips To You - Bali"
            />
            <span className="admin-help">{t.authorHelp}</span>
          </label>
        </div>

        <label className="admin-field">
          <span className="admin-field-label">{t.excerptArtikel}</span>
          <textarea
            className="control"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <span className="admin-help">{t.excerptHelp}</span>
        </label>

        {/* Body Markdown + pratinjau */}
        <div className="admin-field">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span className="admin-field-label">{t.isiArtikel}</span>
            <button
              type="button"
              className="button button-secondary"
              style={{ minHeight: 34, padding: '4px 14px', fontSize: 13 }}
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? (lang === 'id' ? 'Tutup Pratinjau' : 'Close Preview') : t.pratinjauLangsung}
            </button>
          </div>
          <textarea
            className="control"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14, lineHeight: 1.7 }}
            required
          />
          <span className="admin-help">{t.isiArtikelHelp}</span>
          <span className="admin-help">
            ≈ {readingMinutes} {lang === 'id' ? 'menit baca' : 'min read'}
          </span>

          {showPreview && (
            <div className="surface-card" style={{ marginTop: 14 }}>
              <div className="blog-prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          )}
        </div>

        {/* Cover */}
        <div className="admin-field">
          <span className="admin-field-label">{t.coverArtikel}</span>
          <CoverUpload
            currentUrl={coverUrl}
            onUploaded={(url) => setCoverUrl(url)}
            onUploadingChange={setUploading}
            t={t}
          />
        </div>

        {coverUrl && (
          <label className="admin-field">
            <span className="admin-field-label">{t.coverAlt}</span>
            <input
              className="control"
              value={coverAlt}
              onChange={(e) => setCoverAlt(e.target.value)}
              maxLength={255}
              required
            />
            <span className="admin-help">{t.coverAltHelp}</span>
          </label>
        )}

        {/* Panel SEO */}
        <div className="surface-card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: 16 }}>{t.panelSeo}</h2>

          <label className="admin-field">
            <span className="admin-field-label">{t.metaTitleLabel}</span>
            <input
              className="control"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={70}
              placeholder={`${title || '…'} | Drips To You - Bali`}
            />
            <CharCounter value={metaTitle} target={META_TITLE_TARGET} suffix={t.karakterSuffix} overLabel={t.terlaluPanjang} />
          </label>

          <label className="admin-field">
            <span className="admin-field-label">{t.metaDescLabel}</span>
            <textarea
              className="control"
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <CharCounter value={metaDesc} target={META_DESC_TARGET} suffix={t.karakterSuffix} overLabel={t.terlaluPanjang} />
          </label>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span className="admin-field-label">{t.canonicalLabel}</span>
              <input
                className="control"
                value={canonical}
                onChange={(e) => setCanonical(e.target.value)}
                maxLength={500}
                placeholder={`https://dripstoyou.com/blog/${effectiveSlug || '…'}`}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">{t.ogImageLabel}</span>
              <input
                className="control"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                maxLength={500}
                placeholder="https://…"
              />
            </label>
          </div>
        </div>

        {/* Status */}
        <div className="admin-form-grid">
          <label className="admin-field">
            <span className="admin-field-label">{t.statusLabel}</span>
            <select className="control" value={status} onChange={(e) => setStatus(e.target.value as BlogStatus)}>
              {BLOG_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-field-label">{t.publishedAtLabel}</span>
            <input
              className="control"
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              required={status === 'scheduled'}
            />
            <span className="admin-help">{t.publishedAtHelp}</span>
          </label>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="admin-form-actions">
          <button
            className={`button button-primary${saving ? ' loading' : ''}`}
            type="submit"
            disabled={saving || deleting || uploading}
          >
            {uploading ? t.mengunggahStatus : saving ? t.menyimpan : isEdit ? t.simpanArtikel : t.buatArtikel}
          </button>
          <button className="button button-secondary" type="button" onClick={() => router.back()} disabled={saving || deleting}>
            {t.batal}
          </button>
          {isEdit && (
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={saving || deleting}
              style={{ color: '#c0392b', borderColor: 'rgba(192,57,43,.35)', marginLeft: 'auto' }}
            >
              {deleting ? t.menghapus : t.hapus}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
