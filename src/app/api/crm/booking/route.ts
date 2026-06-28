import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('booking', (req, s) => crmProxyForward(req, s, 'booking.php', req.nextUrl.search));
export const POST = crmApiHandler('booking', (req, s) => crmProxyForward(req, s, 'booking.php'));
