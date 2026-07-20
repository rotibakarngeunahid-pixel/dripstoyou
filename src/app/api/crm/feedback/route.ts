import { crmApiHandler } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

// List — gated on 'booking' (not 'feedback'): this is a cross-booking
// aggregate view, same access tier as the global booking list. NURSE only
// gets the per-booking 'feedback' module (send/view-status on their own
// booking), never this list.
export const GET = crmApiHandler('booking', (req, s) => crmProxyForward(req, s, 'feedback.php', req.nextUrl.search));
