import { NextRequest } from 'next/server';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  return phpProxyPath(`products.php${qs ? `?${qs}` : ''}`, {}, 60);
}
