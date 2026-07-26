import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { can, adminHomePath } from '@/lib/auth';
import BlogPostAnalyticsClient from './BlogPostAnalyticsClient';

interface PostSummary {
  id: string;
  title: string;
  slug: string;
}

async function getPostSummary(id: string, token: string): Promise<PostSummary | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/blog.php?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ? { id: json.data.id, title: json.data.title, slug: json.data.slug } : null;
  } catch {
    return null;
  }
}

export default async function BlogPostAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  if (!can(session, 'blog', 'view')) redirect(adminHomePath(session));

  const { id } = await params;
  const post = await getPostSummary(id, session.adminToken);
  if (!post) notFound();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/blog/analytics" className="icon-link">← Kembali ke Analytics</Link>
          <h1 className="admin-title">{post.title}</h1>
          <p className="admin-subtitle">Analytics Artikel · /blog/{post.slug}</p>
        </div>
      </div>
      <BlogPostAnalyticsClient postId={post.id} />
    </div>
  );
}
