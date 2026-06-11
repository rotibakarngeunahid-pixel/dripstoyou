import { NextRequest } from 'next/server';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body   = await req.text();

  // Forward the real client IP so the PHP rate limiter throttles per visitor,
  // not per shared Vercel egress IP (which would block unrelated users).
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  if (clientIp) headers['X-Forwarded-For'] = clientIp;

  return phpProxyPath('bookings.php', {
    method: 'POST',
    headers,
    body,
  });
}
