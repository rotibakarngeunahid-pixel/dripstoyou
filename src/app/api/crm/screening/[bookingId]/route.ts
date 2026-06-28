import { NextRequest } from 'next/server';
import { crmGuard } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const g = await crmGuard('screening');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'screening.php', `?bookingId=${encodeURIComponent(bookingId)}`);
}

export async function POST(req: NextRequest) {
  const g = await crmGuard('screening');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'screening.php');
}
