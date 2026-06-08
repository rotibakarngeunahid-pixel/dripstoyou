import { NextRequest } from 'next/server';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body   = await req.text();
  return phpProxyPath('bookings.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}
