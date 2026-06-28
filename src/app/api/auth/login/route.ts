import { NextRequest, NextResponse } from 'next/server';
import { getSession, AdminRole } from '@/lib/session';
import { getCRMSession, CRMRole } from '@/lib/crm-session';
import { crmHomePath } from '@/lib/crm-permissions';

// Unified single-portal login (/login).
//  - Website admins (admins table): set the /admin session AND, if their role maps
//    to CRM access, the /crm session too (single sign-on bridge).
//  - CRM-only staff (nurse/finance/native crm_staff): set the /crm session.
// Returns { success, target } — where to redirect after login.

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

  let isWebsiteAdmin = false;

  // 1. Website admin
  const adminRes = await callPhp('admin/login.php');
  if (adminRes.ok && adminRes.json.success) {
    const { token, admin } = adminRes.json.data as { token: string; admin: { id: string; name: string; email: string; role: string } };
    const s = await getSession();
    s.adminId = admin.id; s.email = admin.email; s.role = admin.role as AdminRole; s.name = admin.name; s.adminToken = token;
    await s.save();
    isWebsiteAdmin = true;
  } else if (adminRes.status === 503) {
    return NextResponse.json({ error: 'Server autentikasi tidak dapat dihubungi. Coba lagi.' }, { status: 503 });
  }

  // 2. CRM (native crm_staff, or admin bridge)
  let crmTarget: string | null = null;
  const crmRes = await callPhp('crm/auth/login.php');
  if (crmRes.ok && crmRes.json.success) {
    const { token, staff, modules } = crmRes.json.data as {
      token: string; staff: { id: string; name: string; email: string; role: string }; modules?: string[];
    };
    const cs = await getCRMSession();
    cs.staffId = staff.id; cs.email = staff.email; cs.role = staff.role as CRMRole; cs.name = staff.name;
    cs.crmToken = token; cs.modules = Array.isArray(modules) ? modules : []; cs.isWebsiteAdmin = isWebsiteAdmin;
    await cs.save();
    crmTarget = crmHomePath(staff.role as CRMRole, cs.modules);
  }

  if (!isWebsiteAdmin && !crmTarget) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
  }

  // Prefer the CRM home; admins without CRM access (CONTENT_ADMIN) go to /admin.
  const target = crmTarget ?? '/admin/dashboard';
  return NextResponse.json({ success: true, target });
}
