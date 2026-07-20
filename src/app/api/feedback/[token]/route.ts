import { NextRequest } from 'next/server';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

// Forward the real client IP so the PHP rate limiter throttles per visitor, not
// per shared Vercel egress IP (which would block unrelated clients).
function forwardedIpHeaders(req: NextRequest): Record<string, string> {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  return ip ? { 'X-Forwarded-For': ip } : {};
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return phpProxyPath(`feedback-public.php?token=${encodeURIComponent(token)}`, {
    headers: forwardedIpHeaders(req),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.text();
  return phpProxyPath(`feedback-public.php?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...forwardedIpHeaders(req) },
    body,
  });
}
