import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { can } from '@/lib/auth';
import { phpProxyPath } from '@/lib/php-fetch';

export const dynamic = 'force-dynamic';

// Read-only, so no CSRF check — same pattern as GET on api/admin/blog/route.ts.
// Piggybacks on the `blog` module permission (view): Super Admin + Admin Blog
// (CONTENT_ADMIN) already have it, ADMIN_OPERASIONAL already doesn't.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(session, 'blog', 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Forward the query string as-is (scope/from/to/granularity/postId/sort/q/page) —
  // a proxy route that drops query params fails mutations/reads silently, see
  // the CRM proxy query-forwarding bug this codebase already hit once.
  const qs = req.nextUrl.searchParams.toString();
  return phpProxyPath(`admin/blog-analytics.php${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
  });
}
