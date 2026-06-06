import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body   = await req.text();
  const phpRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await phpRes.json();
  return NextResponse.json(data, { status: phpRes.status });
}
