import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCRMSession } from '@/lib/crm-session';

// Unified logout — revoke + destroy both the /admin and /crm sessions.
export async function POST() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

  const adminSession = await getSession();
  if (adminSession.adminToken && base) {
    try {
      await fetch(`${base}/admin/logout.php`, { method: 'POST', headers: { Authorization: `Bearer ${adminSession.adminToken}` }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    } catch { /* best effort */ }
  }
  adminSession.destroy();

  const crmSession = await getCRMSession();
  if (crmSession.crmToken && base) {
    try {
      await fetch(`${base}/crm/auth/logout.php`, { method: 'POST', headers: { Authorization: `Bearer ${crmSession.crmToken}` }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    } catch { /* best effort */ }
  }
  crmSession.destroy();

  return NextResponse.json({ success: true });
}
