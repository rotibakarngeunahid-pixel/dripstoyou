import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/public/Header';
import SiteFooter from '@/components/public/SiteFooter';
import BlogArticleContent from '@/components/public/BlogArticleContent';
import ScrollRevealInit from '@/components/public/ScrollRevealInit';
import JsonLd from '@/components/seo/JsonLd';
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  CONTENT_ROBOTS,
  DEFAULT_OG_IMAGE,
  NOINDEX_FOLLOW,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo';
import { toPublicImageUrl } from '@/lib/images';
import { countWords, renderMarkdownDocument } from '@/lib/markdown';
import {
  blogAuthorName,
  blogCanonicalUrl,
  blogCategoryUrl,
  blogMetaDescription,
  blogMetaTitle,
  blogPostUrl,
  BLOG_FEED_URL,
  BLOG_URL,
  fetchBlogPost,
  toIsoOrNull,
} from '@/lib/blog';

export const revalidate = 60;

// og:image / JSON-LD wajib URL publik https (toPublicImageUrl), sedangkan
// next/image memakai host backend langsung (toDirectImageUrl, sudah diterapkan
// di fetchBlogPost) — kalau tertukar, gambar 403 self-loop di Vercel.
function socialImage(post: { og_image_url: string | null; cover_image_url: string | null }): string {
  return toPublicImageUrl(post.og_image_url || post.cover_image_url) || DEFAULT_OG_IMAGE;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) return { title: 'Not Found', robots: NOINDEX_FOLLOW };

  const title = blogMetaTitle(post);
  const description = blogMetaDescription(post);
  const canonical = blogCanonicalUrl(post);
  const image = socialImage(post);
  const published = toIsoOrNull(post.published_at);
  const modified = toIsoOrNull(post.updated_at);

  return {
    title: { absolute: title },
    description,
    authors: [{ name: blogAuthorName(post) }],
    // `robots` anak menimpa milik layout root sepenuhnya, jadi directive
    // Discover/rich-result harus disebut ulang di sini (bukan diwariskan).
    robots: CONTENT_ROBOTS,
    openGraph: {
      title,
      description,
      // og:url mengikuti canonical efektif — kalau artikel meng-override
      // canonical_url, dua sinyal ini tidak boleh saling bertentangan.
      url: canonical,
      // Artikel memakai og:type=article (halaman lain di situs ini pakai website).
      type: 'article',
      siteName: SITE_NAME,
      locale: 'en_US',
      ...(published ? { publishedTime: published } : {}),
      ...(modified ? { modifiedTime: modified } : {}),
      authors: [blogAuthorName(post)],
      ...(post.category ? { section: post.category.name } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: post.cover_image_alt || post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical,
      types: { 'application/rss+xml': BLOG_FEED_URL },
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);

  // blog.php hanya mengembalikan artikel published & published_at <= NOW(), jadi
  // draft / scheduled / archived otomatis 404 di URL publik (§8.7).
  if (!post) notFound();

  // Body dirender ulang dari Markdown di server. Kolom `content` (HTML turunan)
  // sengaja TIDAK pernah disuntikkan mentah — lihat src/lib/markdown.ts.
  const source = post.content_source || post.content;
  const { html: contentHtml, headings } = renderMarkdownDocument(source);

  const description = blogMetaDescription(post);
  const canonical = blogCanonicalUrl(post);

  return (
    <>
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          slug: post.slug,
          description,
          canonicalUrl: canonical,
          image: socialImage(post),
          datePublished: toIsoOrNull(post.published_at),
          dateModified: toIsoOrNull(post.updated_at) ?? toIsoOrNull(post.published_at),
          authorName: blogAuthorName(post),
          section: post.category?.name ?? null,
          wordCount: countWords(source),
          readingMinutes: post.reading_minutes,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: 'Blog', url: BLOG_URL },
          ...(post.category
            ? [{ name: post.category.name, url: blogCategoryUrl(post.category.slug) }]
            : []),
          { name: post.title, url: blogPostUrl(post.slug) },
        ])}
      />
      <Header />
      <BlogArticleContent
        post={post}
        contentHtml={contentHtml}
        headings={headings}
        related={post.related ?? []}
      />
      <SiteFooter />
      <ScrollRevealInit />
    </>
  );
}
