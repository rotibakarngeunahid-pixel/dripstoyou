import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  return phpProxyPath(`admin/products.php?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session.role, 'products:write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body   = await req.text();
  return phpProxyPath(`admin/products.php?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session.role, 'products:write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  return phpProxyPath(`admin/products.php?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.adminToken}` },
  });
}
