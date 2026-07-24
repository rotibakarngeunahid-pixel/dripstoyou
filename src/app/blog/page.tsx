import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import BlogListContent from '@/components/public/BlogListContent';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo';
import { BLOG_REVALIDATE, BLOG_URL, fetchBlogCategories, fetchBlogPosts, pagedUrl } from '@/lib/blog';

export const revalidate = 60;

const TITLE = 'IV Therapy & Wellness Blog in Bali';
const DESCRIPTION =
  'Guides from the Drips To You medical team on IV drips, hydration, recovery, and staying well while you travel in Bali.';

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> },
): Promise<Metadata> {
  const page = parsePage((await searchParams).page);

  // Halaman 1 → canonical bersih; halaman dalam → self-canonical + sufiks judul
  // agar tidak dianggap duplikat dan tetap ter-crawl (§8.3).
  const url = pagedUrl(BLOG_URL, page);
  const title = page > 1 ? `${TITLE} — Page ${page}` : TITLE;
  const description = page > 1 ? `${DESCRIPTION} Page ${page}.` : DESCRIPTION;

  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: { canonical: url },
  };
}

export default async function BlogPage(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> },
) {
  const page = parsePage((await searchParams).page);

  const [list, categories] = await Promise.all([
    fetchBlogPosts({ page, revalidate: BLOG_REVALIDATE }),
    fetchBlogCategories(),
  ]);

  // Halaman paginasi di luar jangkauan → 404, supaya crawler tidak menemukan
  // rangkaian halaman kosong yang bisa di-index.
  if (page > 1 && list.items.length === 0) notFound();

  return (
    <>
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
