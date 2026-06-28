import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('audit', (req, s) => crmProxyForward(req, s, 'audit.php', req.nextUrl.search));
