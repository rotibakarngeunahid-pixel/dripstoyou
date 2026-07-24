import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import { phpProxyPath } from '@/lib/php-fetch';
import { csrfFailureResponse, verifyCsrf } from '@/lib/csrf';
import { blogCategoryCreateSchema, zodErrorMessage } from '@/lib/validation/blog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session.role, 'content:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const qs = req.nextUrl.searchParams.toString();
  return phpProxyPath(`admin/blog-categories.php${qs ? `?${qs}` : ''}`, {
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

  const parsed = blogCategoryCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 422 });
  }

  return phpProxyPath('admin/blog-categories.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body: JSON.stringify(parsed.data),
  });
}
