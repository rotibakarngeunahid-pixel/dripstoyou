import { NextRequest, NextResponse } from 'next/server';
import { adminApiHandler } from '@/lib/auth';
import type { SessionData } from '@/lib/session';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST = adminApiHandler('products:write', async (req: NextRequest, session: SessionData) => {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Format request tidak valid' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'File tidak ditemukan dalam request' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File kosong' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
  }

  // Forward the file to the PHP backend (which has a persistent filesystem).
  // Vercel is serverless — it cannot write files permanently.
  const phpFormData = new FormData();
  phpFormData.append('file', file, (file as File).name ?? 'upload');

  try {
    const phpRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/upload.php`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.adminToken ?? ''}` },
        body: phpFormData,
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      },
    );

    let phpData: unknown;
    try { phpData = await phpRes.json(); } catch { phpData = {}; }

    if (!phpRes.ok) {
      const msg = (phpData as { message?: string }).message ?? 'Upload gagal di server';
      return NextResponse.json({ error: msg }, { status: phpRes.status });
    }

    // PHP returns the direct URL (e.g. https://dripstoyou.com/php-api/uploads/products/xxx.webp).
    // Files live on the PHP hosting which serves them at that URL directly — no proxy needed.
    return NextResponse.json(phpData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload error';
    return NextResponse.json({ error: `Upload error: ${msg}` }, { status: 500 });
  }
});
