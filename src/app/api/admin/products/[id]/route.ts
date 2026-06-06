import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

function phpAdminFetch(path: string, init: RequestInit, token: string) {
  return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const phpRes = await phpAdminFetch(`products.php?id=${id}`, {}, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body   = await req.text();
  const phpRes = await phpAdminFetch(`products.php?id=${id}`, { method: 'PATCH', body }, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const phpRes = await phpAdminFetch(`products.php?id=${id}`, { method: 'DELETE' }, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}
