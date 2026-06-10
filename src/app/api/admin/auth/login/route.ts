import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 422 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
  if (!apiBase) {
    console.error('[admin/login] NEXT_PUBLIC_API_BASE_URL is not set');
    return NextResponse.json(
      { error: 'Konfigurasi server tidak lengkap. Hubungi administrator.' },
      { status: 503 },
    );
  }

  // Guard: reject obviously wrong base URLs that would loop back to this Vercel app.
  // dripstoyou.com now points to Vercel — calling it from a Vercel function = 403 loop.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (appUrl && apiBase.startsWith(appUrl)) {
    console.error(
      '[admin/login] NEXT_PUBLIC_API_BASE_URL points to the same domain as NEXT_PUBLIC_APP_URL. ' +
      'This would cause a self-loop. Set NEXT_PUBLIC_API_BASE_URL to the PHP backend subdomain ' +
      '(e.g. https://api.dripstoyou.com), then redeploy.'
    );
    return NextResponse.json(
      { error: 'Konfigurasi API URL tidak valid. Hubungi administrator.' },
      { status: 503 },
    );
  }

  const loginUrl = `${apiBase}/admin/login.php`;

  try {
    const phpRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    let phpData: Record<string, unknown>;
    try {
      phpData = await phpRes.json() as Record<string, unknown>;
    } catch {
      console.error(`[admin/login] PHP backend at ${loginUrl} returned non-JSON (status ${phpRes.status})`);
      return NextResponse.json(
        { error: 'Server autentikasi mengembalikan respons tidak valid. Coba lagi.' },
        { status: 502 },
      );
    }

    if (!phpRes.ok || !phpData.success) {
      console.warn(`[admin/login] PHP backend rejected login (status ${phpRes.status})`);
      return NextResponse.json(
        { error: typeof phpData.message === 'string' ? phpData.message : 'Email atau password tidak valid.' },
        { status: phpRes.status === 429 ? 429 : 401 },
      );
    }

    const { token, admin } = phpData.data as {
      token: string;
      admin: { id: string; name: string; email: string; role: string };
    };

    const session      = await getSession();
    session.adminId    = admin.id;
    session.email      = admin.email;
    session.role       = admin.role as 'SUPER_ADMIN' | 'ADMIN_OPERASIONAL' | 'CONTENT_ADMIN';
    session.name       = admin.name;
    session.adminToken = token;
    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      admin,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[admin/login] Failed to reach PHP backend at ${loginUrl}: ${msg}`);
    return NextResponse.json(
      { error: 'Server autentikasi tidak dapat dihubungi. Coba lagi.' },
      { status: 503 },
    );
  }
}
