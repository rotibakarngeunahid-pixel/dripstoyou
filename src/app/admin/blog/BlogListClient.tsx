'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import { adminMutate } from '@/lib/admin-mutate';
import type { BlogStatus } from '@/lib/blog-status';
import type { AdminBlogCategory } from './BlogForm';

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: BlogStatus;
  published_at: string | null;
  updated_at: string | null;
  reading_minutes: number | null;
  view_count: number;
  category: { name: string; slug: string } | null;
}

const STATUS_COLORS: Record<BlogStatus, { color: string; background: string }> = {
  draft:     { color: '#7a6a3f', background: 'rgba(201,148,76,.14)' },
  scheduled: { color: '#1d6b7a', background: 'rgba(41,128,139,.14)' },
  published: { color: '#1b8f4d', background: 'rgba(27,143,77,.12)' },
  archived:  { color: '#6b7280', background: 'rgba(107,114,128,.14)' },
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BlogListClient({
  posts,
  categories,
}: {
  posts: AdminBlogPost[];
  categories: AdminBlogCategory[];
}) {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<'' | BlogStatus>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const statusLabels: Record<BlogStatus, string> = {
    draft: t.statusDraft,
    scheduled: t.statusScheduled,
    published: t.statusPublished,
    archived: t.statusArchived,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (statusFilter && post.status !== statusFilter) return false;
      if (categoryFilter && post.category?.slug !== categoryFilter) return false;
      if (q && !`${post.title} ${post.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, statusFilter, categoryFilter, query]);

  async function toggleStatus(post: AdminBlogPost) {
    setBusyId(post.id);
    setError('');
    const nextStatus: BlogStatus = post.status === 'published' ? 'draft' : 'published';
    const res = await adminMutate(`/api/admin/blog/${post.id}`, 'PATCH', { status: nextStatus });
    setBusyId(null);
    if (!res.ok) {
      setError(res.error ?? t.gagalMenyimpanArtikel);
      return;
    }
    router.refresh();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.blogTitle}</h1>
          <p className="admin-subtitle">{posts.length} {t.blogSuffix} · {t.blogSubtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/blog/categories" className="button button-secondary">
            {t.kelolaKategoriBlog}
          </Link>
          <Link href="/admin/blog/new" className="button button-primary">
            {t.tambahArtikelBtn}
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="admin-form-grid three" style={{ marginBottom: 18 }}>
        <label className="admin-field">
          <span className="admin-field-label">{t.statusLabel}</span>
          <select
            className="control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | BlogStatus)}
          >
            <option value="">{t.semuaStatus}</option>
            <option value="draft">{t.statusDraft}</option>
            <option value="scheduled">{t.statusScheduled}</option>
            <option value="published">{t.statusPublished}</option>
            <option value="archived">{t.statusArchived}</option>
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-field-label">{t.kategoriArtikel}</span>
          <select className="control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">{lang === 'id' ? 'Semua kategori' : 'All categories'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-field-label">{lang === 'id' ? 'Cari' : 'Search'}</span>
          <input
            className="control"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.cariArtikel}
          />
        </label>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-list">
        {filtered.map((post) => {
          const pill = STATUS_COLORS[post.status];
          return (
            <article className="admin-list-item surface-card" key={post.id}>
              <div>
                <div className="admin-list-title-row">
                  <h2 className="admin-list-title">{post.title}</h2>
                  <span className="status-pill" style={{ color: pill.color, background: pill.background }}>
                    {statusLabels[post.status]}
                  </span>
                  {post.category && (
                    <span className="status-pill" style={{ color: 'var(--ocean)', background: 'rgba(41,128,139,.10)' }}>
                      {post.category.name}
                    </span>
                  )}
                </div>
                {post.excerpt && <p className="admin-list-desc">{post.excerpt}</p>}
                <div className="admin-list-meta">
                  <span>/blog/{post.slug}</span>
                  <span>{t.statusPublished}: {formatDate(post.published_at)}</span>
                  <span>{lang === 'id' ? 'Diperbarui' : 'Updated'}: {formatDate(post.updated_at)}</span>
                  {post.reading_minutes && <span>{post.reading_minutes} {lang === 'id' ? 'menit baca' : 'min read'}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => toggleStatus(post)}
                  disabled={busyId === post.id}
                >
                  {busyId === post.id
                    ? t.memproses
                    : post.status === 'published'
                      ? (lang === 'id' ? 'Tarik dari Publik' : 'Unpublish')
                      : (lang === 'id' ? 'Tayangkan' : 'Publish')}
                </button>
                {post.status === 'published' ? (
                  <a
                    href={`/blog/${post.slug}`}
                    className="button button-secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.lihatPublik}
                  </a>
                ) : (
                  <Link href={`/admin/blog/${post.id}/preview`} className="button button-secondary">
                    {t.pratinjau}
                  </Link>
                )}
                <Link href={`/admin/blog/${post.id}/edit`} className="button button-secondary">
                  {t.edit}
                </Link>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state surface-card">
            {t.belumAdaArtikel}{' '}
            <Link href="/admin/blog/new" style={{ color: 'var(--ocean)', fontWeight: 800 }}>
              {t.tulisArtikelPertama}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
