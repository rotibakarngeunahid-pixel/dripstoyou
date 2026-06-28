import { NextRequest, NextResponse } from 'next/server';
import type { CRMSessionData } from './crm-session';

// ─────────────────────────────────────────────────────────────────────────────
// CRM PHP API fetch helpers
// All CRM endpoints live under  <NEXT_PUBLIC_API_BASE_URL>/crm/...
// and require a Bearer token (crm_sessions) which we hold in the iron-session.
// ─────────────────────────────────────────────────────────────────────────────

function crmApiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
  return base || null;
}

/** Raw fetch to a CRM PHP endpoint. `path` is relative to /crm (e.g. 'booking/list.php'). */
export async function crmBackendFetch(
  path: string,
  token: string,
  init: RequestInit = {},
  clientIp?: string | null,
): Promise<Response> {
  const base = crmApiBase();
  if (!base) throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (clientIp) headers['X-Forwarded-For'] = clientIp;

  return fetch(`${base}/crm/${path.replace(/^\/+/, '')}`, {
    ...init,
    headers,
    cache: 'no-store',
    signal: init.signal ?? AbortSignal.timeout(10000),
  });
}

/** Proxy a CRM PHP endpoint and return its JSON response as a NextResponse. */
export async function crmProxy(
  req: NextRequest,
  session: CRMSessionData,
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
  try {
    const res = await crmBackendFetch(path, session.crmToken, init, clientIp);
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = { error: `Backend mengembalikan respons tidak valid (HTTP ${res.status})` };
    }
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Server tidak dapat dihubungi. Coba lagi.' }, { status: 503 });
  }
}

/**
 * Convenience: forward the incoming request's body + method to a CRM PHP endpoint.
 * Use for POST/PATCH/DELETE mutation proxies.
 */
export async function crmProxyForward(
  req: NextRequest,
  session: CRMSessionData,
  path: string,
  search = '',
): Promise<NextResponse> {
  const method = req.method.toUpperCase();
  const init: RequestInit = { method };
  if (method !== 'GET' && method !== 'HEAD') {
    const text = await req.text();
    if (text) init.body = text;
  }
  return crmProxy(req, session, `${path}${search}`, init);
}
