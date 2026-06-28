import { NextRequest } from 'next/server';
import { crmGuard } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

// Allow NURSE (nurse_portal) + ADMIN/OWNER (nurse). PHP enforces assign = manage-only.
export async function GET(req: NextRequest) {
  const g = await crmGuard(null);
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'nurse.php', req.nextUrl.search);
}

export async function POST(req: NextRequest) {
  const g = await crmGuard('nurse');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'nurse.php');
}
