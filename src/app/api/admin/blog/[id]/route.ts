import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import { phpProxyPath } from '@/lib/php-fetch';
import { csrfFailureResponse, verifyCsrf } from '@/lib/csrf';
import { blogPostUpdateSchema, toBlogPhpPayload, zodErrorMessage } from '@/lib/validation/blog';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session.role, 'content:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  return phpProxyPath(`admin/blog.php?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session.role, 'content:write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!(await verifyCsrf(req))) return csrfFailureResponse();

  const { id } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Format request tidak valid' }, { status: 400 });
  }

  const parsed = blogPostUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 422 });
  }

  return phpProxyPath(`admin/blog.php?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body: JSON.stringify(toBlogPhpPayload(parsed.data)),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session.role, 'content:write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!(await verifyCsrf(req))) return csrfFailureResponse();

  const { id } = await params;
  return phpProxyPath(`admin/blog.php?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
  });
}
