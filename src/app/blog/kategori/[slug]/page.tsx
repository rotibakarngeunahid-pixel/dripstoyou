import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import BlogListContent from '@/components/public/BlogListContent';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo';
import {
  blogCategoryUrl,
  BLOG_URL,
  fetchBlogCategories,
  fetchBlogCategory,
  fetchBlogPosts,
  pagedUrl,
} from '@/lib/blog';

export const revalidate = 60;

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

// Halaman kategori wajib punya meta sendiri — tidak boleh duplikat /blog (§8.11).
function categoryMeta(category: { name: string; description: string | null; meta_title: string | null; meta_description: string | null }) {
  const title = category.meta_title?.trim() || `${category.name} — Blog | ${SITE_NAME}`;
  const description =
    category.meta_description?.trim() ||
    category.description?.trim() ||
    `Articles about ${category.name.toLowerCase()} from the Drips To You - Bali medical team — mobile IV therapy across Bali.`;
  return { title, description };
}

export async function generateMetadata(
  { params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  },
): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await fetchBlogCategory(slug);
  if (!category) return { title: 'Not Found', robots: { index: false, follow: false } };

  const page = parsePage(sp.page);
  const base = categoryMeta(category);
  const title = page > 1 ? `${base.title} — Page ${page}` : base.title;
  const url = pagedUrl(blogCategoryUrl(category.slug), page);

  return {
    title: { absolute: title },
    description: base.description,
    openGraph: {
      title,
      description: base.description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Drips To You - Bali Mobile IV Therapy' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: base.description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: { canonical: url },
  };
}

export default async function BlogCategoryPage(
  { params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  },
) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = parsePage(sp.page);

  const category = await fetchBlogCategory(slug);
  if (!category) notFound();

  const [list, categories] = await Promise.all([
    fetchBlogPosts({ page, category: category.slug }),
    fetchBlogCategories(),
  ]);

  if (page > 1 && list.items.length === 0) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: 'Blog', url: BLOG_URL },
          { name: category.name, url: blogCategoryUrl(category.slug) },
        ])}
      />
      <Header />
      <BlogListContent
        posts={list.items}
        categories={categories}
        pagination={list.pagination}
        activeCategory={category.slug}
        basePath={`/blog/kategori/${category.slug}`}
        heading={{
          eyebrow: 'Blog Category',
          title: category.name,
          subtitle: category.description,
        }}
      />
      <SiteFooter />
      <ScrollRevealInit />
    </>
  );
}
