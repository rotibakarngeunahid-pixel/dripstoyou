import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

export async function GET() {
  return phpProxyPath('settings.php', {}, 30);
}
