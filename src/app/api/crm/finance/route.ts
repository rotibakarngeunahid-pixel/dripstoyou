import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('finance', (req, s) => crmProxyForward(req, s, 'finance.php', req.nextUrl.search));
export const POST = crmApiHandler('finance', (req, s) => crmProxyForward(req, s, 'finance.php'));
