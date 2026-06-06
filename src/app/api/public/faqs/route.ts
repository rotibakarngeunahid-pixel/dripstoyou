import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const phpRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/faqs.php`, { cache: 'no-store' });
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}
