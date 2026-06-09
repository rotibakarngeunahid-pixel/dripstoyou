import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET() {
  return phpProxyPath('social-links.php', {}, 120);
}
