import { NextRequest, NextResponse } from 'next/server';
import { getCRMSession, CRMRole } from '@/lib/crm-session';

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 422 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
  if (!apiBase) {
    console.error('[crm/login] NEXT_PUBLIC_API_BASE_URL is not set');
    return NextResponse.json(
      { error: 'Konfigurasi server tidak lengkap. Hubungi administrator.' },
      { status: 503 },
    );
  }

  const loginUrl = `${apiBase}/crm/auth/login.php`;

  // Forward the real client IP so the PHP login rate limiter tracks the visitor.
  const loginHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  if (clientIp) loginHeaders['X-Forwarded-For'] = clientIp;

  try {
    const phpRes = await fetch(loginUrl, {
      method: 'POST',
      headers: loginHeaders,
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    let phpData: Record<string, unknown>;
    try {
      phpData = (await phpRes.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: 'Server autentikasi mengembalikan respons tidak valid. Coba lagi.' },
        { status: 502 },
      );
    }

    if (!phpRes.ok || !phpData.success) {
      return NextResponse.json(
        { error: typeof phpData.message === 'string' ? phpData.message : 'Email atau password salah' },
        { status: phpRes.status === 429 ? 429 : 401 },
      );
    }

    const raw = phpData.data;
    if (
      !raw || typeof raw !== 'object' ||
      typeof (raw as Record<string, unknown>).token !== 'string' ||
      typeof (raw as Record<string, unknown>).staff !== 'object' ||
      !(raw as Record<string, unknown>).staff
    ) {
      console.error('[crm/login] PHP returned unexpected data shape:', raw);
      return NextResponse.json(
        { error: 'Server autentikasi mengembalikan data tidak valid. Hubungi administrator.' },
        { status: 502 },
      );
    }

    const { token, staff, modules } = raw as {
      token: string;
      staff: { id: string; name: string; email: string; role: string };
      modules?: string[];
    };

    const VALID_ROLES: CRMRole[] = ['OWNER', 'ADMIN', 'NURSE', 'FINANCE'];
    if (!VALID_ROLES.includes(staff.role as CRMRole)) {
      console.error('[crm/login] PHP returned unknown role:', staff.role);
      return NextResponse.json({ error: 'Role staff tidak dikenali.' }, { status: 502 });
    }

    const session = await getCRMSession();
    session.staffId = staff.id;
    session.email = staff.email;
    session.role = staff.role as CRMRole;
    session.name = staff.name;
    session.crmToken = token;
    session.modules = Array.isArray(modules) ? modules : [];
    await session.save();

    return NextResponse.json({ success: true, message: 'Login berhasil.', staff });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[crm/login] Failed to reach PHP backend at ${loginUrl}: ${msg}`);
    return NextResponse.json(
      { error: 'Server autentikasi tidak dapat dihubungi. Coba lagi.' },
      { status: 503 },
    );
  }
}
