import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { adminApiHandler } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function detectMime(buf: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp';
  return null;
}

export const POST = adminApiHandler('products:write', async (req: NextRequest) => {
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

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File kosong' }, { status: 400 });
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const mime   = detectMime(buffer);

  if (!mime) {
    return NextResponse.json(
      { error: 'Format tidak didukung. Gunakan JPG, PNG, atau WEBP.' },
      { status: 400 },
    );
  }

  const ext = mime === 'image/jpeg' ? '.jpg' : mime === 'image/png' ? '.png' : '.webp';
  const filename  = `${randomUUID()}${ext}`;

  // UPLOAD_DIR: absolute path to write files (e.g. /var/www/app/public/uploads/products)
  // UPLOAD_PUBLIC_PATH: URL prefix served by Nginx (default /uploads/products)
  const uploadDir    = process.env.UPLOAD_DIR    ?? join(process.cwd(), 'public', 'uploads', 'products');
  const uploadPublic = process.env.UPLOAD_PUBLIC_PATH ?? '/uploads/products';

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);
  } catch (fsErr) {
    const msg = fsErr instanceof Error ? fsErr.message : 'File write failed';
    return NextResponse.json({ error: `Storage error: ${msg}` }, { status: 500 });
  }

  const publicUrl = `${uploadPublic}/${filename}`;
  return NextResponse.json({ success: true, data: { publicUrl, mimeType: mime } });
});
