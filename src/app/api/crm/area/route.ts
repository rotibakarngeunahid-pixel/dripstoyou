import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('area', (req, s) => crmProxyForward(req, s, 'area.php', req.nextUrl.search));
export const POST = crmApiHandler('area', (req, s) => crmProxyForward(req, s, 'area.php'));
