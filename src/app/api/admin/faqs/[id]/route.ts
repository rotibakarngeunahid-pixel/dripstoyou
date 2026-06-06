import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { phpProxy } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

function phpUrl(id: string) {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/faqs.php?id=${encodeURIComponent(id)}`;
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  return phpProxy(phpUrl(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.adminToken ?? ''}` },
    body: await req.text(),
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.pathname.split('/').at(-1)!;
  return phpProxy(phpUrl(id), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
  });
}
