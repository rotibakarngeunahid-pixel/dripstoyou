import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const phpRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/bookings.php?limit=100`,
      {
        headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      },
    );
    return NextResponse.json(await phpRes.json(), { status: phpRes.status });
  } catch {
    return NextResponse.json({ error: 'Backend tidak tersedia' }, { status: 503 });
  }
}
