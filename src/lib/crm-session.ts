import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type CRMRole = 'OWNER' | 'ADMIN' | 'NURSE' | 'FINANCE';

export interface CRMSessionData {
  staffId: string;
  email: string;
  role: CRMRole;
  name: string;
  crmToken: string; // Bearer token for the PHP CRM API
  modules: string[]; // effective modules this staff may access (role default or custom)
  isWebsiteAdmin?: boolean; // also has a website /admin session (logged in via the bridge)
}

function getCRMSessionOptions(): SessionOptions {
  const dedicated = process.env.CRM_SESSION_SECRET;
  const fallback = process.env.SESSION_SECRET;

  if (!dedicated) {
    // Warn once per process start so operators know to set CRM_SESSION_SECRET.
    console.warn(
      '[crm-session] CRM_SESSION_SECRET is not set — falling back to SESSION_SECRET. ' +
      'Set a dedicated CRM_SESSION_SECRET to isolate the CRM session domain.',
    );
  }

  const password = dedicated ?? fallback;
  if (!password || password.length < 32) {
    throw new Error('CRM_SESSION_SECRET must be configured with at least 32 characters');
  }

  const hours = Number(process.env.CRM_SESSION_DURATION_HOURS ?? 8) || 8;

  return {
    cookieName: 'crm_session',
    password,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // 'strict' prevents the session cookie being sent on cross-site navigations.
      sameSite: 'strict',
      // Path '/' (not '/crm') so the cookie is also sent to the /api/crm/* routes.
      maxAge: 60 * 60 * hours,
      path: '/',
    },
  };
}

export async function getCRMSession() {
  const cookieStore = await cookies();
  return getIronSession<CRMSessionData>(cookieStore, getCRMSessionOptions());
}

export async function requireCRMSession(): Promise<CRMSessionData> {
  const session = await getCRMSession();
  if (!session.staffId) {
    throw new Error('Unauthorized');
  }
  return session as CRMSessionData;
}
