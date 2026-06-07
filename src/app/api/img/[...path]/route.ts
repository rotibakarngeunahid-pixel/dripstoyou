import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Public image proxy — serves product images stored on PHP hosting.
// The PHP hosting URL may differ from the Next.js domain, so images cannot
// be loaded directly. This proxy fetches from the PHP server and returns
// the image to the browser, eliminating the cross-origin path mismatch.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const phpBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!phpBase) {
    return new NextResponse('Image server not configured', { status: 503 });
  }

  const relPath = path.join('/');
  if (!relPath.startsWith('products/') && !relPath.startsWith('uploads/')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Files live at {API_BASE}/uploads/products/ on the PHP hosting.
  // e.g. NEXT_PUBLIC_API_BASE_URL=https://dripstoyou.com/php-api
  //   → fetches https://dripstoyou.com/php-api/uploads/products/:file
  const imageUrl = `${phpBase.replace(/\/$/, '')}/uploads/${relPath}`;

  try {
    const res = await fetch(imageUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get('content-type') ?? 'image/webp';
    const data = await res.arrayBuffer();

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 502 });
  }
}
