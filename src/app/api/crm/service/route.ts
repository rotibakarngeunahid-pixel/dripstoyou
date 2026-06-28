import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('service', (req, s) => crmProxyForward(req, s, 'service.php', req.nextUrl.search));
export const POST = crmApiHandler('service', (req, s) => crmProxyForward(req, s, 'service.php'));
