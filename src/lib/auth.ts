import { NextRequest, NextResponse } from 'next/server';
import { requireSession, SessionData, AdminModuleKey } from './session';

type ModuleAction = 'view' | 'manage' | 'delete';

// Mirrors adminCan() in php-api/helpers.php — PHP remains the real trust
// boundary (endpoints can be called directly, bypassing this proxy), this is
// the fast-path used for early 403s and UI gating in Next.js.
export function can(
  session: Pick<SessionData, 'role' | 'permissions'>,
  module: AdminModuleKey,
  action: ModuleAction = 'view',
): boolean {
  if (session.role === 'SUPER_ADMIN') return true;
  return session.permissions?.[module]?.[action] ?? false;
}

export async function requireAdmin(): Promise<SessionData> {
  return requireSession();
}

// Landing page after login / when an admin lacks 'dashboard' access — the
// first module they can actually open, in priority order. Mirrors
// crmHomePath()/HOME_PRIORITY in src/lib/crm-permissions.ts.
const HOME_PRIORITY: { module: AdminModuleKey; path: string }[] = [
  { module: 'dashboard',    path: '/admin/dashboard' },
  { module: 'booking',      path: '/admin/bookings' },
  { module: 'blog',         path: '/admin/blog' },
  { module: 'treatment',    path: '/admin/products' },
  { module: 'faq',          path: '/admin/faqs' },
  { module: 'social_links', path: '/admin/social-links' },
  { module: 'schedule',     path: '/admin/schedule' },
  { module: 'coverage',     path: '/admin/coverage' },
  { module: 'settings',     path: '/admin/settings' },
  { module: 'wa_template',  path: '/admin/settings/wa-template' },
];

export function adminHomePath(session: Pick<SessionData, 'role' | 'permissions'>): string {
  if (session.role === 'SUPER_ADMIN') return '/admin/dashboard';
  for (const h of HOME_PRIORITY) {
    if (can(session, h.module, 'view')) return h.path;
  }
  // Akun tanpa modul apa pun (mis-konfigurasi) — jangan biarkan redirect
  // gagal, meski halamannya sendiri akan menampilkan "tidak ada akses".
  return '/admin/dashboard';
}

export async function requireModule(
  module: AdminModuleKey,
  action: ModuleAction = 'view',
): Promise<SessionData> {
  const session = await requireSession();
  if (!can(session, module, action)) {
    throw new Error('Forbidden');
  }
  return session;
}

export function adminApiHandler(
  moduleCheck: { module: AdminModuleKey; action?: ModuleAction } | null,
  handler: (req: NextRequest, session: SessionData) => Promise<NextResponse<unknown>>
) {
  return async (req: NextRequest) => {
    try {
      const session = moduleCheck
        ? await requireModule(moduleCheck.module, moduleCheck.action)
        : await requireAdmin();
      return await handler(req, session);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Server error';
      if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (msg === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
      console.error('[admin api]', msg);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
