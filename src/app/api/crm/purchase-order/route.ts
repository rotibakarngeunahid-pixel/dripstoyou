import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('purchase_order', (req, s) => crmProxyForward(req, s, 'purchase-order.php', req.nextUrl.search));
export const POST = crmApiHandler('purchase_order', (req, s) => crmProxyForward(req, s, 'purchase-order.php'));
