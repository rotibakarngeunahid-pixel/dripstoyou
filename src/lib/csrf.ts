// CSRF double-submit token untuk mutation admin (CLAUDE.md: "All admin
// mutations require authentication check + RBAC permission check + CSRF token").
//
// Cara kerja:
//   1. Client memanggil GET /api/admin/csrf → server men-set cookie HttpOnly
//      `drip_csrf` DAN mengembalikan nilainya di body.
//   2. Setiap mutation mengirim nilai itu di header `x-csrf-token`.
//   3. Server membandingkan header vs cookie secara timing-safe.
//
// Halaman lintas-situs tidak bisa membaca body respons kita (CORS) sehingga
// tidak bisa memalsukan header-nya, sementara cookie tetap ikut terkirim —
// itulah yang membuat pola double-submit ini menahan CSRF.
//
// Blog adalah fitur pertama yang menegakkan ini (docs/PRD-Blog.md §10.2);
// panel lama (products/faqs) masih tercatat sebagai tech-debt.

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { CSRF_COOKIE, CSRF_HEADER } from '@/lib/csrf-constants';

export { CSRF_COOKIE, CSRF_HEADER };

const TOKEN_RE = /^[a-f0-9]{64}$/;

// Ambil token yang ada, atau terbitkan yang baru. Hanya boleh dipanggil dari
// Route Handler / Server Action (butuh izin menulis cookie).
export async function issueCsrfToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing && TOKEN_RE.test(existing)) return existing;

  const token = randomBytes(32).toString('hex');
  store.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // sejalan dengan umur sesi admin
  });
  return token;
}

export async function verifyCsrf(req: NextRequest): Promise<boolean> {
  const header = req.headers.get(CSRF_HEADER) ?? '';
  const store = await cookies();
  const cookie = store.get(CSRF_COOKIE)?.value ?? '';

  if (!TOKEN_RE.test(header) || !TOKEN_RE.test(cookie)) return false;

  const a = Buffer.from(header, 'utf8');
  const b = Buffer.from(cookie, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function csrfFailureResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Sesi keamanan kedaluwarsa. Muat ulang halaman lalu coba lagi.' },
    { status: 403 },
  );
}
