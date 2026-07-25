import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN_OPERASIONAL' | 'CONTENT_ADMIN';

// Mirrors adminAllModules() in php-api/helpers.php.
export type AdminModuleKey =
  | 'dashboard' | 'booking' | 'treatment' | 'schedule' | 'coverage'
  | 'blog' | 'faq' | 'social_links' | 'settings' | 'wa_template';

export interface AdminModuleGrant {
  view: boolean;
  manage: boolean;
  delete: boolean;
}

// Effective permissions computed server-side (adminEffectivePermissions() in
// helpers.php) and handed over at login — role default, or the admin's
// custom permissions_json override when set. SUPER_ADMIN always has full
// access regardless of this (checked separately, never relies on this map).
export type AdminModulePermissions = Partial<Record<AdminModuleKey, AdminModuleGrant>>;

export interface SessionData {
  adminId: string;
  email: string;
  role: AdminRole;
  name: string;
  adminToken: string;  // Bearer token for PHP API auth
  permissions: AdminModulePermissions;
}

function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 characters');
  }

  return {
    cookieName: 'drip_admin_session',
    password,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.adminId) {
    throw new Error('Unauthorized');
  }
  return session as SessionData;
}
