import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code') ?? '';
  const name = searchParams.get('name') ?? '';

  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (name) params.set('name', name);

  try {
    const phpRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/track.php?${params.toString()}`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    return NextResponse.json(await phpRes.json(), { status: phpRes.status });
  } catch {
    return NextResponse.json({ error: 'Layanan tidak tersedia, coba lagi.' }, { status: 503 });
  }
}
