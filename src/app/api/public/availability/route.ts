import { NextRequest } from 'next/server';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const date   = req.nextUrl.searchParams.get('date') ?? '';
  return phpProxyPath(`availability.php?date=${encodeURIComponent(date)}`, { cache: 'no-store' });
}
