import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const qs     = req.nextUrl.searchParams.toString();
  return phpProxyPath(`admin/products.php${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${session.adminToken}` },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body   = await req.text();
  return phpProxyPath('admin/products.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken}` },
    body,
  });
}
