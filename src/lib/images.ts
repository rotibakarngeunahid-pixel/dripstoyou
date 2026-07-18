// Product image URLs are stored in the DB as https://dripstoyou.com/php-api/...
// (UPLOAD_BASE_URL). On Vercel that path is a rewrite back to this same app, so
// letting the next/image optimizer fetch it would self-loop (403). Rewriting to
// the real PHP host (PHP_BACKEND_URL → NEXT_PUBLIC_API_BASE_URL) lets next/image
// optimize these images (WebP/AVIF, srcset) by fetching cPanel directly.
export function toDirectImageUrl<T extends string | null | undefined>(url: T): T {
  if (!url) return url;
  const phpBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
  if (!phpBase) return url;
  return url.replace(/^https?:\/\/dripstoyou\.com\/php-api/, phpBase) as T;
}

// Inverse of toDirectImageUrl, for og:image / JSON-LD: those must be public
// https URLs, not the (possibly http://) backend host the optimizer fetches.
// The proxied https://dripstoyou.com/php-api/... path serves the same file.
export function toPublicImageUrl<T extends string | null | undefined>(url: T): T {
  if (!url) return url;
  const phpBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
  if (phpBase && url.startsWith(`${phpBase}/`)) {
    return url.replace(phpBase, 'https://dripstoyou.com/php-api') as T;
  }
  return url.replace(/^http:\/\//, 'https://') as T;
}
