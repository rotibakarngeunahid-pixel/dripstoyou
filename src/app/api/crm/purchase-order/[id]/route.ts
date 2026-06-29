import { NextRequest } from 'next/server';
import { crmGuard } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await crmGuard('purchase_order');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'purchase-order.php', `?id=${encodeURIComponent(id)}`);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await crmGuard('purchase_order');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'purchase-order.php', `?id=${encodeURIComponent(id)}`);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await crmGuard('purchase_order');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'purchase-order.php', `?id=${encodeURIComponent(id)}`);
}
