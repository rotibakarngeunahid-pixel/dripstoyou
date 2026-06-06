import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PHP = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/social-links.php`;

export async function GET() {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const phpRes = await fetch(PHP, {
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
    cache: 'no-store',
  });
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const phpRes = await fetch(PHP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body: await req.text(),
    cache: 'no-store',
  });
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}
