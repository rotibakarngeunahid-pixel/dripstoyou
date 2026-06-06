import { NextRequest, NextResponse } from 'next/server';
import { requireSession, SessionData, AdminRole } from './session';

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN:       ['*'],
  ADMIN_OPERASIONAL: ['bookings:read', 'bookings:write', 'schedule:read', 'schedule:write', 'areas:read', 'areas:write', 'products:read', 'audit:read'],
  CONTENT_ADMIN:     ['products:read', 'products:write', 'content:read', 'content:write'],
};

export function can(role: AdminRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes('*') || perms.includes(permission);
}

export async function requireAdmin(req?: NextRequest): Promise<SessionData> {
  return requireSession();
}

export async function requirePermission(
  permission: string,
  req?: NextRequest
): Promise<SessionData> {
  const session = await requireSession();
  if (!can(session.role, permission)) {
    throw new Error('Forbidden');
  }
  return session;
}

export function adminApiHandler(
  permission: string | null,
  handler: (req: NextRequest, session: SessionData) => Promise<NextResponse<unknown>>
) {
  return async (req: NextRequest) => {
    try {
      const session = permission
        ? await requirePermission(permission, req)
        : await requireAdmin(req);
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
