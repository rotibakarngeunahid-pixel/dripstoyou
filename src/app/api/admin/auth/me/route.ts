import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    admin: {
      id:    session.adminId,
      name:  session.name,
      email: session.email,
      role:  session.role,
    },
  });
}
