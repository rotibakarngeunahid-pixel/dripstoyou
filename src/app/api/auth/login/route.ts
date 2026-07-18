import { NextRequest, NextResponse } from 'next/server';
import { getSession, AdminRole } from '@/lib/session';
import { getCRMSession, CRMRole } from '@/lib/crm-session';
import { crmHomePath } from '@/lib/crm-permissions';

// Unified single-portal login (/login).
//  - Website admins (admins table): set the /admin session AND, if their role maps
//    to CRM access, the /crm session too (single sign-on bridge).
//  - CRM-only staff (nurse/finance/native crm_staff): set the /crm session.
// Returns { success, target } — where to redirect after login.
//
// Auth goes through php-api/unified-login.php, which checks both identities in
// ONE request and records exactly one login_attempts row. Calling the two legacy
// endpoints separately made every wrong password count double — and a successful
// CRM-only login still logged one failure — so the 5-per-15-minutes limit locked
// real users out after ~3 typos. The legacy two-call flow is kept only as a
// fallback while unified-login.php has not been uploaded to the PHP host yet.

type AdminPayload = { token: string; admin: { id: string; name: string; email: string; role: string } };
type CRMPayload = {
  token: string;
  staff: { id: string; name: string; email: string; role: string };
  modules?: string[];
};

async function saveAdminSession(p: AdminPayload): Promise<void> {
  const s = await getSession();
  s.adminId = p.admin.id; s.email = p.admin.email; s.role = p.admin.role as AdminRole;
  s.name = p.admin.name; s.adminToken = p.token;
  await s.save();
}

async function saveCRMSession(p: CRMPayload, isWebsiteAdmin: boolean): Promise<string> {
  const cs = await getCRMSession();
  cs.staffId = p.staff.id; cs.email = p.staff.email; cs.role = p.staff.role as CRMRole;
  cs.name = p.staff.name; cs.crmToken = p.token;
  cs.modules = Array.isArray(p.modules) ? p.modules : [];
  cs.isWebsiteAdmin = isWebsiteAdmin;
  await cs.save();
  return crmHomePath(p.staff.role as CRMRole, cs.modules);
}

function rateLimited(json: Record<string, unknown>): NextResponse {
  return NextResponse.json(
    {
      error: typeof json.message === 'string'
        ? json.message
        : 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    },
    { status: 429 },
  );
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 422 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
  if (!apiBase) {
    return NextResponse.json({ error: 'Konfigurasi server tidak lengkap. Hubungi administrator.' }, { status: 503 });
  }

  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  const fwd: Record<string, string> = { 'Content-Type': 'application/json' };
  if (clientIp) fwd['X-Forwarded-For'] = clientIp;
  const payload = JSON.stringify({ email, password });

  async function callPhp(path: string) {
    try {
      const res = await fetch(`${apiBase}/${path}`, { method: 'POST', headers: fwd, body: payload, cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return { ok: res.ok, status: res.status, json };
    } catch {
      return { ok: false, status: 503, json: {} as Record<string, unknown> };
    }
  }

  // ── Preferred path: one PHP call, one rate-limit row ─────────────────────────
  const uni = await callPhp('unified-login.php');
  if (uni.status === 429) return rateLimited(uni.json);
  if (uni.ok && uni.json.success) {
    const data = (uni.json.data ?? {}) as { admin?: AdminPayload; crm?: CRMPayload };
    let isWebsiteAdmin = false;
    let crmTarget: string | null = null;
    if (data.admin?.token && data.admin.admin) {
      await saveAdminSession(data.admin);
      isWebsiteAdmin = true;
    }
    if (data.crm?.token && data.crm.staff) {
      crmTarget = await saveCRMSession(data.crm, isWebsiteAdmin);
    }
    if (!isWebsiteAdmin && !crmTarget) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }
    return NextResponse.json({ success: true, target: crmTarget ?? '/admin/dashboard' });
  }
  if (uni.status === 401) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
  }

  // ── Fallback: unified-login.php not deployed yet (404/405/5xx) ───────────────
  let isWebsiteAdmin = false;

  // 1. Website admin
  const adminRes = await callPhp('admin/login.php');
  if (adminRes.status === 429) return rateLimited(adminRes.json);
  if (adminRes.ok && adminRes.json.success) {
    await saveAdminSession(adminRes.json.data as AdminPayload);
    isWebsiteAdmin = true;
  } else if (adminRes.status === 503) {
    return NextResponse.json({ error: 'Server autentikasi tidak dapat dihubungi. Coba lagi.' }, { status: 503 });
  }

  // 2. CRM (native crm_staff, or admin bridge)
  let crmTarget: string | null = null;
  const crmRes = await callPhp('crm/auth/login.php');
  if (crmRes.status === 429 && !isWebsiteAdmin) return rateLimited(crmRes.json);
  if (crmRes.ok && crmRes.json.success) {
    crmTarget = await saveCRMSession(crmRes.json.data as CRMPayload, isWebsiteAdmin);
  }

  if (!isWebsiteAdmin && !crmTarget) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
  }

  // Prefer the CRM home; admins without CRM access (CONTENT_ADMIN) go to /admin.
  return NextResponse.json({ success: true, target: crmTarget ?? '/admin/dashboard' });
}
