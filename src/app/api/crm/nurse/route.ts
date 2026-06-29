import { NextRequest, NextResponse } from 'next/server';
import { requireCRMSession } from '@/lib/crm-session';
import { crmGuard } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

// GET: accessible to staff with 'nurse' (manage) OR 'nurse_portal' (personal schedule).
export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireCRMSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const mods = session.modules ?? [];
  const allowed = session.role === 'OWNER' || mods.includes('nurse') || mods.includes('nurse_portal');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return crmProxyForward(req, session, 'nurse.php', req.nextUrl.search);
}

export async function POST(req: NextRequest) {
  const g = await crmGuard('nurse');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'nurse.php');
}
