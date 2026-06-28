import { NextRequest, NextResponse } from 'next/server';
import { requireCRMSession, CRMSessionData } from './crm-session';

// A staff may access a module if it's in their effective module list (OWNER → all).
// PHP re-checks this on every request as the final trust boundary.
function sessionCan(session: CRMSessionData, module: string): boolean {
  if (session.role === 'OWNER') return true;
  return (session.modules ?? []).includes(module);
}

/**
 * Guard for dynamic route handlers that need access to `params`.
 * Returns either `{ session }` or `{ error }` (a ready-to-return NextResponse).
 *
 *   const g = await crmGuard('booking');
 *   if ('error' in g) return g.error;
 *   // use g.session
 */
export async function crmGuard(
  module: string | null,
): Promise<{ session: CRMSessionData; error?: never } | { error: NextResponse; session?: never }> {
  try {
    const session = await requireCRMSession();
    if (module && !sessionCan(session, module)) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { session };
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}

/**
 * Wrap a CRM API route handler with auth + (optional) module permission checks.
 * Mirrors adminApiHandler in src/lib/auth.ts.
 *
 *   export const GET = crmApiHandler('booking', async (req, session) => { ... });
 *
 * Pass `null` as the module to require only authentication.
 */
export function crmApiHandler(
  module: string | null,
  handler: (req: NextRequest, session: CRMSessionData) => Promise<NextResponse<unknown>>,
) {
  return async (req: NextRequest) => {
    try {
      const session = await requireCRMSession();
      if (module && !sessionCan(session, module)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return await handler(req, session);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Server error';
      if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      console.error('[crm api]', msg);
      return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
  };
}
