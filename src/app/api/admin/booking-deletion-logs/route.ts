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

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  const phpRes = await phpAdminFetch(
    `booking-deletion-logs.php${qs ? `?${qs}` : ''}`,
    {},
    session.adminToken,
  );

  // Forward CSV export response as-is
  const contentType = phpRes.headers.get('content-type') ?? '';
  if (contentType.includes('text/csv')) {
    const buf = await phpRes.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': phpRes.headers.get('content-disposition') ?? 'attachment; filename="deletion-logs.csv"',
      },
    });
  }

  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}
