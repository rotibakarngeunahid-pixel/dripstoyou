import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('inventory', (req, s) => crmProxyForward(req, s, 'inventory.php', req.nextUrl.search));
export const POST = crmApiHandler('inventory', (req, s) => crmProxyForward(req, s, 'inventory.php'));
