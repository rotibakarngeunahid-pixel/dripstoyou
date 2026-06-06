import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const phpRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings.php`, { cache: 'no-store' });
  const data   = await phpRes.json();
  return NextResponse.json(data, { status: phpRes.status });
}
