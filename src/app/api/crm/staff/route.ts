import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('staff', (req, s) => crmProxyForward(req, s, 'staff.php', req.nextUrl.search));
export const POST = crmApiHandler('staff', (req, s) => crmProxyForward(req, s, 'staff.php'));
export const DELETE = crmApiHandler('staff', (req, s) => crmProxyForward(req, s, 'staff.php', req.nextUrl.search));
