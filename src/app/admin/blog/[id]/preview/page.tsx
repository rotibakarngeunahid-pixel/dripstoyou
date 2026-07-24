import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import { renderMarkdown } from '@/lib/markdown';
import { toDirectImageUrl } from '@/lib/images';
import { SITE_NAME } from '@/lib/seo';
import type { AdminBlogPostDetail } from '../../BlogForm';

// Pratinjau draft hidup di bawah /admin (butuh sesi) dan SELALU noindex (§8.7).
// next.config.ts juga menambahkan X-Robots-Tag: noindex untuk seluruh /admin/*.
export const metadata: Metadata = {
  title: 'Pratinjau Artikel',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

interface PreviewPost extends AdminBlogPostDetail {
  reading_minutes: number | null;
  updated_at: string | null;
  category: { name: string; slug: string } | null;
}

async function getPost(id: string, token: string): Promise<PreviewPost | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/blog.php?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Terjadwal',
  published: 'Tayang',
  archived: 'Arsip',
};

export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  if (!can(session.role, 'content:read')) redirect('/admin/dashboard');

  const { id } = await params;
  const post = await getPost(id, session.adminToken);
  if (!post) notFound();

  const contentHtml = renderMarkdown(post.content_source || post.content);
  const coverUrl = toDirectImageUrl(post.cover_image_url);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Pratinjau Artikel</h1>
          <p className="admin-subtitle">
            Status: {STATUS_LABELS[post.status] ?? post.status} · Halaman ini tidak diindeks mesin pencari.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={`/admin/blog/${post.id}/edit`} className="button button-secondary">Edit</Link>
          <Link href="/admin/blog" className="button button-secondary">Kembali</Link>
        </div>
      </div>

      <section className="surface-card">
        <article className="blog-article" style={{ padding: 0 }}>
          <header className="blog-article-head">
            {post.category && <span className="blog-article-cat">{post.category.name}</span>}
            <h2 className="blog-article-title">{post.title}</h2>
            {post.excerpt && <p className="blog-article-lead">{post.excerpt}</p>}
            <div className="blog-article-meta">
              <span>/blog/{post.slug}</span>
              <span>{post.author_name || SITE_NAME}</span>
              {post.reading_minutes && <span>{post.reading_minutes} menit baca</span>}
            </div>
          </header>

          {coverUrl && (
            <figure className="blog-article-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={post.cover_image_alt ?? ''} className="blog-article-cover-img" />
            </figure>
          )}

          <div className="blog-prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>
      </section>
    </div>
  );
}
