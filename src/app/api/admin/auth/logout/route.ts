import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = await getSession();
  const adminId = session.adminId;
  session.destroy();

  if (adminId) {
    await auditLog({
      action: 'LOGOUT',
      actorAdminId: adminId,
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    });
  }

  return NextResponse.json({ success: true });
}
