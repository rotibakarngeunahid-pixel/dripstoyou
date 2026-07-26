import { NextRequest } from 'next/server';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

// Mirrors api/public/bookings/route.ts: thin pass-through so PHP's rate
// limiter/bot filter sees the real visitor IP, not Vercel's egress IP.
// Never throws — a failed beacon must never surface as an error on the
// article page (the client helper also wraps this in try/catch).
export async function POST(req: NextRequest) {
  const body = await req.text();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  if (clientIp) headers['X-Forwarded-For'] = clientIp;
  // PHP's bot filter and device/browser/OS classification both read the
  // User-Agent header — without forwarding it, the outbound fetch's own
  // (unrelated) UA reaches PHP instead of the visitor's, silently breaking
  // both bot filtering and every visitor breakdown.
  const userAgent = req.headers.get('user-agent');
  if (userAgent) headers['User-Agent'] = userAgent;

  return phpProxyPath('blog-track.php', {
    method: 'POST',
    headers,
    body,
  });
}
