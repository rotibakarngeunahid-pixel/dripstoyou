// RSS 2.0 untuk /blog.
//
// Feed adalah kanal distribusi pasif: agregator, Google Reader-like apps, dan
// beberapa crawler menemukan artikel baru dari sini lebih cepat daripada dari
// sitemap. Halaman blog menautkannya lewat `alternates.types` (jadi tag
// <link rel="alternate" type="application/rss+xml"> ada di <head>).
//
// Sumbernya endpoint publik `blog.php` yang sudah memfilter published — sama
// seperti sitemap, feed tidak boleh punya jalur data sendiri ke tabel mentah.

import { toPublicImageUrl } from '@/lib/images';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import {
  BLOG_FEED_URL,
  BLOG_URL,
  blogPostUrl,
  fetchBlogPosts,
  toIsoOrNull,
  type BlogPostCard,
} from '@/lib/blog';

// Sejalan dengan sitemap: artikel baru muncul di feed paling lama 15 menit.
export const revalidate = 900;

const FEED_ITEMS = 20;
const FEED_DESCRIPTION =
  'Guides from the Drips To You medical team on IV drips, hydration, recovery, and staying well while you travel in Bali.';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// RSS <pubDate> wajib RFC-822, bukan ISO 8601.
function toRfc822(value: string | null | undefined): string | null {
  const iso = toIsoOrNull(value);
  return iso ? new Date(iso).toUTCString() : null;
}

// <enclosure> wajib menyebut MIME yang benar; kalau ekstensinya tidak dikenali,
// lebih baik gambarnya tidak disertakan daripada disertakan dengan tipe salah.
function imageMime(url: string): string | null {
  const ext = /\.(jpe?g|png|webp|gif|avif)(?:[?#]|$)/i.exec(url)?.[1]?.toLowerCase();
  if (!ext) return null;
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return `image/${ext}`;
}

function itemXml(post: BlogPostCard): string {
  const url = blogPostUrl(post.slug);
  const pubDate = toRfc822(post.published_at);
  const image = toPublicImageUrl(post.cover_image_url);
  const mime = image ? imageMime(image) : null;

  return [
    '    <item>',
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    post.excerpt ? `      <description>${escapeXml(post.excerpt)}</description>` : '',
    pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
    post.category ? `      <category>${escapeXml(post.category.name)}</category>` : '',
    image && mime ? `      <enclosure url="${escapeXml(image)}" type="${mime}" />` : '',
    '    </item>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export async function GET(): Promise<Response> {
  const { items } = await fetchBlogPosts({ perPage: FEED_ITEMS, revalidate });
  const lastBuild = toRfc822(items[0]?.published_at) ?? new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`Blog | ${SITE_NAME}`)}</title>
    <link>${BLOG_URL}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <image>
      <url>${escapeXml(`${SITE_URL}/favicon-96x96.png`)}</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${BLOG_URL}</link>
    </image>
    <atom:link href="${BLOG_FEED_URL}" rel="self" type="application/rss+xml" />
${items.map(itemXml).join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${revalidate}, stale-while-revalidate=3600`,
    },
  });
}
