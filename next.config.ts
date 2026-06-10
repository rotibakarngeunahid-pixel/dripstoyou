import type { NextConfig } from 'next';

// PHP backend URL — set NEXT_PUBLIC_API_BASE_URL in Vercel env vars.
// Previously this was https://dripstoyou.com/php-api (when cPanel hosted the domain).
// Now that dripstoyou.com → Vercel, the PHP backend must use a separate subdomain:
// https://api.dripstoyou.com  (create an A record → cPanel server IP)
const phpApiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      // PHP backend subdomain — new uploads stored here
      { protocol: 'https', hostname: 'api.dripstoyou.com' },
      // Keep dripstoyou.com for any existing DB records that still use the old URL
      { protocol: 'https', hostname: 'dripstoyou.com' },
      { protocol: 'http',  hostname: 'dripstoyou.com' },
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },

  // Proxy old product image URLs (https://dripstoyou.com/php-api/uploads/...)
  // to the new PHP backend subdomain so existing DB records keep working.
  async rewrites() {
    if (!phpApiBase) return [];
    return [
      {
        source: '/php-api/:path*',
        destination: `${phpApiBase}/:path*`,
      },
    ];
  },

  async headers() {
    return [
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
