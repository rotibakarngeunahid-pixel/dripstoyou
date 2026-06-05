import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { AdminRole } from '@prisma/client';

export interface SessionData {
  adminId: string;
  email: string;
  role: AdminRole;
  name: string;
}

const SESSION_OPTIONS: SessionOptions = {
  cookieName: 'drip_admin_session',
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.adminId) {
    throw new Error('Unauthorized');
  }
  return session as SessionData;
}
