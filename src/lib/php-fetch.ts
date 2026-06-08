import { NextResponse } from 'next/server';

export function phpApiUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

export async function phpProxy(
  url: string,
  init?: RequestInit,
): Promise<NextResponse> {
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = { error: `PHP API error (HTTP ${res.status})` };
    }
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend API unreachable' }, { status: 503 });
  }
}

export async function phpProxyPath(
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const url = phpApiUrl(path);
  if (!url) {
    return NextResponse.json({ error: 'Backend API is not configured' }, { status: 503 });
  }
  return phpProxy(url, init);
}
