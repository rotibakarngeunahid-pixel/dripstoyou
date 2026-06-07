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

  async redirects() {
    // Old image URLs in the DB use /uploads/products/ (root path).
    // New uploads go to /php-api/uploads/products/ on the PHP host.
    // Redirect old URLs so they resolve to the correct PHP host path.
    return [
      {
        source: '/uploads/products/:filename',
        destination: 'https://dripstoyou.com/php-api/uploads/products/:filename',
        permanent: false,
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
