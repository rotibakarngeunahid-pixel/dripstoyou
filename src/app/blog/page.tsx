import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import BlogListContent from '@/components/public/BlogListContent';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import JsonLd from '@/components/seo/JsonLd';
import { toPublicImageUrl } from '@/lib/images';
import {
  blogListingJsonLd,
  breadcrumbJsonLd,
  CONTENT_ROBOTS,
  DEFAULT_OG_IMAGE,
  NOINDEX_FOLLOW,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo';
import {
  BLOG_FEED_URL,
  BLOG_REVALIDATE,
  BLOG_URL,
  fetchBlogCategories,
  fetchBlogPosts,
  pagedUrl,
  toIsoOrNull,
  type BlogListResult,
} from '@/lib/blog';

export const revalidate = 60;

const TITLE = 'IV Therapy & Wellness Blog in Bali';
const DESCRIPTION =
  'Guides from the Drips To You medical team on IV drips, hydration, recovery, and staying well while you travel in Bali.';

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

// Dipanggil dari generateMetadata DAN dari komponen halaman dengan argumen yang
// sama persis, supaya Next.js hanya sekali menghubungi backend per request.
function loadPage(page: number): Promise<BlogListResult> {
  return fetchBlogPosts({ page, revalidate: BLOG_REVALIDATE });
}

// `?page=999` tetap membalas HTTP 200 di project ini (soft-404 app-wide karena
// root loading.tsx membuat semua route streaming). Tanpa penanda ini, crawler
// bisa mengindeks deret halaman kosong tak terbatas — jadi halaman di luar
// jangkauan diberi noindex eksplisit, bukan hanya notFound().
function isOutOfRange(page: number, list: BlogListResult): boolean {
  return page > 1 && list.items.length === 0;
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> },
): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const list = await loadPage(page);

  // Halaman 1 → canonical bersih; halaman dalam → self-canonical + sufiks judul
  // agar tidak dianggap duplikat dan tetap ter-crawl (§8.3).
  const url = pagedUrl(BLOG_URL, page);
  const title = page > 1 ? `${TITLE} — Page ${page}` : TITLE;
  const description = page > 1 ? `${DESCRIPTION} Page ${page}.` : DESCRIPTION;

  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    description,
    robots: isOutOfRange(page, list) ? NOINDEX_FOLLOW : CONTENT_ROBOTS,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
      types: { 'application/rss+xml': BLOG_FEED_URL },
    },
  };
}

export default async function BlogPage(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> },
) {
  const page = parsePage((await searchParams).page);

  const [list, categories] = await Promise.all([loadPage(page), fetchBlogCategories()]);

  // Halaman paginasi di luar jangkauan → 404, supaya crawler tidak menemukan
  // rangkaian halaman kosong yang bisa di-index.
  if (isOutOfRange(page, list)) notFound();

  const url = pagedUrl(BLOG_URL, page);

  return (
    <>
      <JsonLd
        data={blogListingJsonLd({
          url,
          name: page > 1 ? `${TITLE} — Page ${page}` : TITLE,
          description: DESCRIPTION,
          items: list.items.map((post) => ({
            title: post.title,
            slug: post.slug,
            description: post.excerpt,
            image: toPublicImageUrl(post.cover_image_url),
            datePublished: toIsoOrNull(post.published_at),
            dateModified: toIsoOrNull(post.updated_at),
          })),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: 'Blog', url: BLOG_URL },
        ])}
      />
      <Header />
      <BlogListContent
        posts={list.items}
        categories={categories}
        pagination={list.pagination}
        basePath="/blog"
      />
      <SiteFooter />
      <ScrollRevealInit />
    </>
  );
}
