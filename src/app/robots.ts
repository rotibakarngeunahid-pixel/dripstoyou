import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/crm/',
          '/php-api/',
          '/login',
          '/consent/',
          '/cek-booking',
        ],
      },
    ],
    sitemap: 'https://dripstoyou.com/sitemap.xml',
  };
}
