import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { phpProxy } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

function phpUrl(id: string) {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coverage.php?id=${encodeURIComponent(id)}`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  return phpProxy(phpUrl(id), { headers: { Authorization: `Bearer ${session.adminToken ?? ''}` } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  return phpProxy(phpUrl(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body: await req.text(),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  return phpProxy(phpUrl(id), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
    redirect: 'error',
  });
}
