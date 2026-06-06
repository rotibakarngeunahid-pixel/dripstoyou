import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Proxy to PHP seed endpoint
// GET /api/admin/seed?secret=YOUR_SEED_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? '';
  const phpRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/seed.php?secret=${encodeURIComponent(secret)}`,
    { cache: 'no-store' },
  );
  return NextResponse.json(await phpRes.json(), { status: phpRes.status });
}
