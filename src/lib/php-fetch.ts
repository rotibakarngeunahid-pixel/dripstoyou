import { NextResponse } from 'next/server';

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
