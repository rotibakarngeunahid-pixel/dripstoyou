import { NextRequest, NextResponse } from 'next/server';
import { phpApiUrl } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code') ?? '';
  const name = searchParams.get('name') ?? '';

  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (name) params.set('name', name);

  try {
    const url = phpApiUrl(`track.php?${params.toString()}`);
    if (!url) return NextResponse.json({ error: 'Backend API is not configured' }, { status: 503 });
    const phpRes = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    return NextResponse.json(await phpRes.json(), { status: phpRes.status });
  } catch {
    return NextResponse.json({ error: 'Layanan tidak tersedia, coba lagi.' }, { status: 503 });
  }
}
