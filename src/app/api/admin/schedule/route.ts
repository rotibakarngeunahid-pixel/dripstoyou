import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session, 'schedule', 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return phpProxyPath('admin/schedule.php', {
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session, 'schedule', 'manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body   = await req.text();
  return phpProxyPath('admin/schedule.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body,
  });
}
