import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('whatsapp', (req, s) => crmProxyForward(req, s, 'whatsapp.php', req.nextUrl.search));
export const POST = crmApiHandler('whatsapp', (req, s) => crmProxyForward(req, s, 'whatsapp.php', req.nextUrl.search));
export const DELETE = crmApiHandler('whatsapp', (req, s) => crmProxyForward(req, s, 'whatsapp.php', req.nextUrl.search));
