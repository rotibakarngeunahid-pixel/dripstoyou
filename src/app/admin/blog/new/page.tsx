import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import BlogForm, { type AdminBlogCategory } from '../BlogForm';

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

export default async function NewBlogPostPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  if (!can(session.role, 'content:write')) redirect('/admin/dashboard');

  const categories = await getCategories(session.adminToken);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Tulis Artikel Baru</h1>
          <p className="admin-subtitle">Artikel disimpan sebagai draft sampai statusnya diubah ke Tayang.</p>
        </div>
      </div>
      <section className="form-card">
        <BlogForm categories={categories} />
      </section>
    </div>
  );
}
