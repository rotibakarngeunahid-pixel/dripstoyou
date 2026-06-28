import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function base(): string | null {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || null;
}

// GET → whether first-run setup is needed (no auth; PHP only reveals a boolean).
export async function GET() {
  const b = base();
  if (!b) return NextResponse.json({ error: 'Konfigurasi server tidak lengkap.' }, { status: 503 });
  try {
    const res = await fetch(`${b}/crm/setup.php`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Server tidak dapat dihubungi.' }, { status: 503 });
  }
}

// POST → create the first OWNER (PHP enforces "only while crm_staff is empty").
export async function POST(req: NextRequest) {
  const b = base();
  if (!b) return NextResponse.json({ error: 'Konfigurasi server tidak lengkap.' }, { status: 503 });
  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (clientIp) headers['X-Forwarded-For'] = clientIp;
  try {
    const res = await fetch(`${b}/crm/setup.php`, {
      method: 'POST',
      headers,
      body: await req.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Server tidak dapat dihubungi.' }, { status: 503 });
  }
}
