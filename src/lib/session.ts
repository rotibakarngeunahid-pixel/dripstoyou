import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN_OPERASIONAL' | 'CONTENT_ADMIN';

export interface SessionData {
  adminId: string;
  email: string;
  role: AdminRole;
  name: string;
  adminToken: string;  // Bearer token for PHP API auth
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
