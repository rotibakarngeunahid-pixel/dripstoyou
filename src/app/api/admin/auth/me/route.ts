import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  let session;
  try {
    session = await getSession();
  } catch (error) {
    console.error('[admin auth] Invalid session configuration', error);
    return NextResponse.json(
      { error: 'Admin session is not configured.' },
      { status: 503 },
    );
  }

  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const phpRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/me.php`, {
      headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!phpRes.ok) {
      session.destroy();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    const phpData = await phpRes.json();
    if (!phpData.success || !phpData.data) {
      session.destroy();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    return NextResponse.json({ success: true, admin: phpData.data });
  } catch {
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}
