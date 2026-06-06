import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function phpAdminFetch(path: string, init: RequestInit, token: string) {
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

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const qs     = req.nextUrl.searchParams.toString();
  const phpRes = await phpAdminFetch(`products.php${qs ? `?${qs}` : ''}`, {}, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body   = await req.text();
  const phpRes = await phpAdminFetch('products.php', { method: 'POST', body }, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}
