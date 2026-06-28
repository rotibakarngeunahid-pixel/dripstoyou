import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export const GET = crmApiHandler('patient', (req, s) => crmProxyForward(req, s, 'patient.php', req.nextUrl.search));
export const POST = crmApiHandler('patient', (req, s) => crmProxyForward(req, s, 'patient.php'));
