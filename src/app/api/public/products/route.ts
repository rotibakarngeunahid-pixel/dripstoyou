import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const api     = process.env.NEXT_PUBLIC_API_BASE_URL;
  const qs      = req.nextUrl.searchParams.toString();
  const url     = `${api}/products.php${qs ? `?${qs}` : ''}`;
  const phpRes  = await fetch(url, { cache: 'no-store' });
  const data    = await phpRes.json();
  return NextResponse.json(data, { status: phpRes.status });
}
