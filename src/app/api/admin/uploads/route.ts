import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { adminApiHandler } from '@/lib/auth';
import type { SessionData } from '@/lib/session';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const WEBP_QUALITY = 82;

async function toWebP(file: File): Promise<{ buffer: Buffer; filename: string }> {
  const original = Buffer.from(await file.arrayBuffer());
  const type = file.type.toLowerCase();
  const isWebP = type === 'image/webp';
  // Skip conversion if already WebP — just ensure it still passes through sharp for safety
  const buffer = await sharp(original)
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const filename = `${baseName}${isWebP ? '' : ''}.webp`;
  return { buffer, filename };
}

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

  // Convert to WebP before forwarding to PHP backend.
  let uploadBlob: Blob;
  let uploadFilename: string;
  try {
    const { buffer, filename } = await toWebP(file as File);
    uploadBlob = new Blob([new Uint8Array(buffer)], { type: 'image/webp' });
    uploadFilename = filename;
  } catch {
    // Conversion failed — fall back to the original file.
    uploadBlob = file as File;
    uploadFilename = (file as File).name ?? 'upload';
  }

  const phpFormData = new FormData();
  phpFormData.append('file', uploadBlob, uploadFilename);

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

    return NextResponse.json(phpData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload error';
    return NextResponse.json({ error: `Upload error: ${msg}` }, { status: 500 });
  }
});
