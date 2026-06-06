import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const date   = req.nextUrl.searchParams.get('date') ?? '';
  const phpRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/availability.php?date=${encodeURIComponent(date)}`,
    { cache: 'no-store' },
  );
  const data = await phpRes.json();
  return NextResponse.json(data, { status: phpRes.status });
}
