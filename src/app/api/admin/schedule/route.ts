import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return phpProxyPath('admin/schedule.php', {
    headers: { Authorization: `Bearer ${session.adminToken}` },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body   = await req.text();
  return phpProxyPath('admin/schedule.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken}` },
    body,
  });
}
