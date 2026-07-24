import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { adminApiHandler, can } from '@/lib/auth';
import type { SessionData } from '@/lib/session';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const WEBP_QUALITY = 82;

// Subfolder tujuan di php-api/uploads/. `products` tetap default supaya
// pemanggil lama (ProductForm) tidak perlu berubah.
const UPLOAD_TYPES = ['products', 'blog'] as const;
type UploadType = (typeof UPLOAD_TYPES)[number];

function resolveUploadType(value: FormDataEntryValue | null): UploadType {
  return typeof value === 'string' && (UPLOAD_TYPES as readonly string[]).includes(value)
    ? (value as UploadType)
    : 'products';
}

async function toWebP(file: File): Promise<{ buffer: Buffer; filename: string }> {
  const original = Buffer.from(await file.arrayBuffer());
  const buffer = await sharp(original)
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const filename = `${baseName}.webp`;
  return { buffer, filename };
}

// Permission dicek di dalam handler karena tergantung `type`: upload cover blog
// butuh content:write, upload foto produk butuh products:write.
export const POST = adminApiHandler(null, async (req: NextRequest, session: SessionData) => {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Format request tidak valid' }, { status: 400 });
  }

  const uploadType = resolveUploadType(formData.get('type'));
  const permission = uploadType === 'blog' ? 'content:write' : 'products:write';
  if (!can(session.role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  phpFormData.append('type', uploadType);

  try {
    const phpRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/upload.php?type=${uploadType}`,
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
