import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST() {
  const session = await getSession();
  const token   = session.adminToken;

  // Revoke token on PHP side (best-effort, don't fail if PHP is down)
  if (token) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/logout.php`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
  }

  session.destroy();
  return NextResponse.json({ success: true });
}
