import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('dashboard', (req, s) => crmProxyForward(req, s, 'dashboard.php', req.nextUrl.search));
