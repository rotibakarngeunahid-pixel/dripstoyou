import { NextResponse } from 'next/server';
import { getCRMSession } from '@/lib/crm-session';

export async function POST() {
  const session = await getCRMSession();
  const token = session.crmToken;

  if (token) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/auth/logout.php`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      /* best-effort revoke */
    }
  }

  session.destroy();
  return NextResponse.json({ success: true });
}
