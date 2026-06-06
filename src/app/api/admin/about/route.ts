import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { phpProxy } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

const PHP = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/about.php`;

export async function GET() {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return phpProxy(PHP, { headers: { Authorization: `Bearer ${session.adminToken ?? ''}` } });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return phpProxy(PHP, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body: await req.text(),
  });
}
