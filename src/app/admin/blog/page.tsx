import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import BlogListClient, { type AdminBlogPost } from './BlogListClient';
import type { AdminBlogCategory } from './BlogForm';

async function getPosts(token: string): Promise<AdminBlogPost[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/blog.php?per_page=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data?.items) ? json.data.items : [];
  } catch {
    return [];
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

export default async function AdminBlogPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  // Blog = permission konten. ADMIN_OPERASIONAL tidak punya content:* sama sekali.
  if (!can(session.role, 'content:read')) redirect('/admin/dashboard');

  const [posts, categories] = await Promise.all([
    getPosts(session.adminToken),
    getCategories(session.adminToken),
  ]);

  return <BlogListClient posts={posts} categories={categories} />;
}
