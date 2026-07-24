import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import BlogCategoriesClient, { type AdminBlogCategoryRow } from './BlogCategoriesClient';

async function getCategories(token: string): Promise<AdminBlogCategoryRow[]> {
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

export default async function BlogCategoriesPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  if (!can(session.role, 'content:read')) redirect('/admin/dashboard');

  const categories = await getCategories(session.adminToken);
  return <BlogCategoriesClient categories={categories} />;
}
