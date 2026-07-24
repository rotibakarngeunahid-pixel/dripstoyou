import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import { phpProxyPath } from '@/lib/php-fetch';
import { csrfFailureResponse, verifyCsrf } from '@/lib/csrf';
import { blogPostCreateSchema, toBlogPhpPayload, zodErrorMessage } from '@/lib/validation/blog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Blog dibatasi permission konten — ADMIN_OPERASIONAL tidak boleh melihat sama sekali.
  if (!can(session.role, 'content:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Teruskan query string apa adanya (status/category/q/page). Proxy CRM pernah
  // gagal diam-diam karena query tidak diteruskan — jangan ulangi.
  const qs = req.nextUrl.searchParams.toString();
  return phpProxyPath(`admin/blog.php${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session.role, 'content:write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!(await verifyCsrf(req))) return csrfFailureResponse();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Format request tidak valid' }, { status: 400 });
  }

  const parsed = blogPostCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 422 });
  }

  return phpProxyPath('admin/blog.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body: JSON.stringify(toBlogPhpPayload(parsed.data)),
  });
}
