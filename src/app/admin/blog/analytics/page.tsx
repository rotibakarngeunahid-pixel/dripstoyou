import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { can, adminHomePath } from '@/lib/auth';
import BlogAnalyticsClient from './BlogAnalyticsClient';

export default async function BlogAnalyticsPage() {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  // Sama dengan gerbang /admin/blog: piggyback modul `blog`, bukan modul baru —
  // Super Admin + Admin Blog (CONTENT_ADMIN) sudah otomatis dapat akses ini.
  if (!can(session, 'blog', 'view')) redirect(adminHomePath(session));

  return <BlogAnalyticsClient />;
}
