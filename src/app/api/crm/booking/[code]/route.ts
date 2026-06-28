import { NextRequest } from 'next/server';
import { crmGuard } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const g = await crmGuard('booking');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'booking.php', `?code=${encodeURIComponent(code)}`);
}

export async function PATCH(req: NextRequest) {
  const g = await crmGuard('booking');
  if ('error' in g) return g.error;
  const id = req.nextUrl.searchParams.get('id') ?? '';
  return crmProxyForward(req, g.session, 'booking.php', `?id=${encodeURIComponent(id)}`);
}
