import { NextRequest, NextResponse } from 'next/server';
import { crmGuard } from '@/lib/crm-auth';
import { crmProxyForward } from '@/lib/crm-fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const g = await crmGuard('booking');
  if ('error' in g) return g.error;
  return crmProxyForward(req, g.session, 'booking.php', `?code=${encodeURIComponent(code)}`);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const g = await crmGuard('booking');
  if ('error' in g) return g.error;
  if (!code) return NextResponse.json({ error: 'Booking code wajib diisi.' }, { status: 400 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Booking ID wajib diisi.' }, { status: 400 });
  return crmProxyForward(req, g.session, 'booking.php', `?id=${encodeURIComponent(id)}`);
}
