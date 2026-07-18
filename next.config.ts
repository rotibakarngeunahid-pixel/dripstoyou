import type { NextConfig } from 'next';

// ─── PHP backend resolution ───────────────────────────────────────────────────
//
// ARCHITECTURE (after dripstoyou.com → Vercel DNS migration):
//   Browser / Vercel → dripstoyou.com        (Vercel, Next.js)
//   Vercel (server)  → api.dripstoyou.com    (cPanel hosting, PHP + MySQL)
//
// PHP_BACKEND_URL (server-side only, NOT NEXT_PUBLIC_):
//   Set this in Vercel Dashboard → Settings → Environment Variables.
//   Value: https://api.dripstoyou.com  (subdomain pointing to cPanel php-api/ folder)
//
// Why NOT use NEXT_PUBLIC_API_BASE_URL as-is:
//   If NEXT_PUBLIC_API_BASE_URL = https://dripstoyou.com/php-api, Vercel serverless
//   functions calling that URL hit themselves → Vercel blocks with 403 (self-loop).
//
// How the env override works:
//   At build time, next.config.ts reads PHP_BACKEND_URL (if set) and uses it as the
//   effective value of NEXT_PUBLIC_API_BASE_URL for ALL code (both server and client).
//   This means no changes are needed in any of the 20+ API route files — they keep
//   reading process.env.NEXT_PUBLIC_API_BASE_URL and automatically get the right URL.
//
// UPLOAD_BASE_URL in php-api/config.php stays https://dripstoyou.com/php-api.
//   New uploads are stored at dripstoyou.com/php-api/uploads/products/... (unchanged).
//   The /php-api/* rewrite below proxies these requests to api.dripstoyou.com.
// ─────────────────────────────────────────────────────────────────────────────

const phpBackendUrl = (process.env.PHP_BACKEND_URL ?? '').replace(/\/+$/, '');

// Effective API base: prefer PHP_BACKEND_URL (server IP), fall back to NEXT_PUBLIC_
const effectiveApiBase = (
  process.env.PHP_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  // Override NEXT_PUBLIC_API_BASE_URL at build time so all existing server and client
  // code automatically uses the correct PHP backend URL with zero per-file changes.
  env: {
    NEXT_PUBLIC_API_BASE_URL: effectiveApiBase,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      // PHP backend served via subdomain (api.dripstoyou.com → cPanel php-api/).
      // http is required: PHP_BACKEND_URL is http:// (https on this host 302s
      // to www.dripstoyou.com → Vercel 403 self-loop).
      { protocol: 'https', hostname: 'api.dripstoyou.com' },
      { protocol: 'http',  hostname: 'api.dripstoyou.com' },
      // dripstoyou.com kept for legacy DB image URLs and next/image optimization
      { protocol: 'https', hostname: 'dripstoyou.com' },
      { protocol: 'http',  hostname: 'dripstoyou.com' },
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },

  // Canonicalize www → apex so Google never indexes duplicate hosts
  // (www.dripstoyou.com currently serves 200 instead of redirecting).
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.dripstoyou.com' }],
        destination: 'https://dripstoyou.com/:path*',
        permanent: true,
      },
    ];
  },

  // Proxy /php-api/* requests to the actual PHP server (api.dripstoyou.com).
  // This makes https://dripstoyou.com/php-api/uploads/products/... image URLs
  // work transparently — DB records and UPLOAD_BASE_URL never need to change.
  async rewrites() {
    if (!phpBackendUrl) return [];
    return [
      {
        source: '/php-api/:path*',
        destination: `${phpBackendUrl}/:path*`,
      },
    ];
  },

  async headers() {
    return [
      // Belt-and-braces: private/utility routes must never be indexed even if
      // a crawler reaches them through an external link (robots.txt disallow
      // alone does not prevent indexing of the URL itself).
      {
        source: '/(admin|crm|login|consent|cek-booking)/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/(admin|crm|login|consent|cek-booking)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'X-Frame-Options',             value: 'DENY' },
          { key: 'X-XSS-Protection',            value: '1; mode=block' },
          { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
