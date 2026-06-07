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

  try {
    const phpRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    const phpData = await phpRes.json();

    if (!phpRes.ok || !phpData.success) {
      return NextResponse.json(
        { error: phpData.message ?? 'Email atau password tidak valid.' },
        { status: phpRes.status },
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
  } catch {
    return NextResponse.json(
      { error: 'Server autentikasi tidak dapat dihubungi. Coba lagi.' },
      { status: 503 },
    );
  }
}
