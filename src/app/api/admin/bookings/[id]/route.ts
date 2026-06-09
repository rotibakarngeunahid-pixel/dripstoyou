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
  const phpRes = await phpAdminFetch(`bookings.php?id=${encodeURIComponent(id)}`, {}, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body   = await req.text();
  const phpRes = await phpAdminFetch(`bookings.php?id=${encodeURIComponent(id)}`, { method: 'PATCH', body }, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body    = await req.text();

  // Forward the original client IP so PHP can record it in the deletion log
  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  const phpRes = await phpAdminFetch(
    `bookings.php?id=${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      body,
      headers: clientIp ? { 'X-Forwarded-For': clientIp } : {},
    },
    session.adminToken,
  );
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}
