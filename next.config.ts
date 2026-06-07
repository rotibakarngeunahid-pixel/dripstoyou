import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'dripstoyou.com' },
      { protocol: 'http',  hostname: 'dripstoyou.com' },
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },

  async rewrites() {
    // Old product image URLs stored in the DB point to /uploads/products/ on this domain.
    // dripstoyou.com (Vercel) has no /uploads/ directory — they live on the PHP host.
    // Rewrite them transparently to the /api/img proxy so they load correctly.
    return [
      {
        source: '/uploads/products/:filename',
        destination: '/api/img/products/:filename',
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
          { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
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
