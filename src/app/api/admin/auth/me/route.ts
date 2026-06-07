import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      admin: {
        id:    session.adminId,
        email: session.email,
        role:  session.role,
        name:  session.name,
      },
    });
  } catch (error) {
    console.error('[admin auth/me]', error);
    return NextResponse.json({ error: 'Admin session is not configured.' }, { status: 503 });
  }
}
