import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

function phpAdminFetch(method: string, body: string | null, token: string) {
  return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/schedule.php`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body ? { body } : {}),
    cache: 'no-store',
  });
}

export async function GET() {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const phpRes = await phpAdminFetch('GET', null, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body   = await req.text();
  const phpRes = await phpAdminFetch('PUT', body, session.adminToken);
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}
