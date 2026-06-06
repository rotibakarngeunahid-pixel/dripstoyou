import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const phpRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/bookings-export.php`,
    {
      headers: { Authorization: `Bearer ${session.adminToken}` },
      cache: 'no-store',
    },
  );

  if (!phpRes.ok) {
    const err = await phpRes.json();
    return NextResponse.json(err, { status: phpRes.status });
  }

  const csv       = await phpRes.arrayBuffer();
  const filename  = `bookings-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
