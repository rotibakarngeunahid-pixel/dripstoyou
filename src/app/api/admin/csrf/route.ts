import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { issueCsrfToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

// GET /api/admin/csrf — terbitkan (atau kembalikan) token CSRF untuk sesi ini.
// Cookie-nya HttpOnly; nilainya hanya bisa dibaca lewat body respons ini, yang
// tidak bisa diakses situs lain karena CORS. Lihat src/lib/csrf.ts.
export async function GET() {
  const session = await getSession();
  if (!session.adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = await issueCsrfToken();
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
}
