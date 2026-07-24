import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import BlogForm, { type AdminBlogCategory, type AdminBlogPostDetail } from '../../BlogForm';

async function getPost(id: string, token: string): Promise<AdminBlogPostDetail | null> {
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

async function getCategories(token: string): Promise<AdminBlogCategory[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/blog-categories.php`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  if (!can(session.role, 'content:write')) redirect('/admin/dashboard');

  const { id } = await params;
  const [post, categories] = await Promise.all([
    getPost(id, session.adminToken),
    getCategories(session.adminToken),
  ]);
  if (!post) notFound();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Edit Artikel</h1>
          <p className="admin-subtitle">{post.title}</p>
        </div>
        <Link href={`/admin/blog/${post.id}/preview`} className="button button-secondary">
          Pratinjau
        </Link>
      </div>
      <section className="form-card">
        <BlogForm post={post} categories={categories} />
      </section>
    </div>
  );
}
