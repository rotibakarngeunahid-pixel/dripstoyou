// Tipe + data layer publik untuk blog.
//
// Halaman publik memanggil PHP langsung dari Server Component (persis pola
// treatments/[slug]) — tidak ada proxy Next.js untuk blog publik. Endpoint
// `blog.php` sendiri sudah hanya mengembalikan artikel published, jadi draft /
// scheduled / archived tidak pernah bocor ke sini maupun ke sitemap.

import { toDirectImageUrl } from '@/lib/images';
import { markdownToPlainText } from '@/lib/markdown';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const BLOG_PER_PAGE = 9;
export const BLOG_REVALIDATE = 60; // detik — juga menentukan lag publish → tayang & sitemap

export interface BlogCategoryRef {
  name: string;
  slug: string;
}

export interface BlogPostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  reading_minutes: number | null;
  published_at: string | null;
  updated_at: string | null;
  category: BlogCategoryRef | null;
}

export interface BlogPost extends BlogPostCard {
  content: string;
  content_source: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  author_name: string | null;
  related?: BlogPostCard[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  post_count: number;
}

export interface BlogPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface BlogListResult {
  items: BlogPostCard[];
  pagination: BlogPagination;
}

const EMPTY_LIST: BlogListResult = {
  items: [],
  pagination: { page: 1, perPage: BLOG_PER_PAGE, total: 0, totalPages: 0 },
};

function apiBase(): string | null {
  return process.env.NEXT_PUBLIC_API_BASE_URL || null;
}

// next/image tidak boleh mengambil gambar lewat https://dripstoyou.com/php-api
// (rewrite balik ke app ini sendiri → 403 self-loop). Lihat src/lib/images.ts.
function withDirectCover<T extends BlogPostCard>(post: T): T {
  return { ...post, cover_image_url: toDirectImageUrl(post.cover_image_url) };
}

export async function fetchBlogPosts(opts: {
  page?: number;
  perPage?: number;
  category?: string;
  revalidate?: number;
} = {}): Promise<BlogListResult> {
  const base = apiBase();
  if (!base) return EMPTY_LIST;

  const params = new URLSearchParams({
    page: String(Math.max(1, opts.page ?? 1)),
    per_page: String(opts.perPage ?? BLOG_PER_PAGE),
  });
  if (opts.category) params.set('category', opts.category);

  try {
    const res = await fetch(`${base}/blog.php?${params.toString()}`, {
      next: { revalidate: opts.revalidate ?? BLOG_REVALIDATE },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return EMPTY_LIST;
    const json = (await res.json()) as { data?: BlogListResult };
    const data = json.data;
    if (!data || !Array.isArray(data.items)) return EMPTY_LIST;
    return { items: data.items.map(withDirectCover), pagination: data.pagination ?? EMPTY_LIST.pagination };
  } catch {
    return EMPTY_LIST;
  }
}

export async function fetchBlogPost(slug: string, includeRelated = true): Promise<BlogPost | null> {
  const base = apiBase();
  if (!base) return null;

  try {
    const res = await fetch(
      `${base}/blog.php?slug=${encodeURIComponent(slug)}${includeRelated ? '&include_related=1' : ''}`,
      { next: { revalidate: BLOG_REVALIDATE }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: BlogPost };
    const post = json.data;
    if (!post) return null;
    return {
      ...withDirectCover(post),
      related: Array.isArray(post.related) ? post.related.map(withDirectCover) : [],
    };
  } catch {
    return null;
  }
}

export async function fetchBlogCategories(revalidate = 3600): Promise<BlogCategory[]> {
  const base = apiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/blog-categories.php`, {
      next: { revalidate },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: BlogCategory[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function fetchBlogCategory(slug: string): Promise<BlogCategory | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/blog-categories.php?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: BLOG_REVALIDATE },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: BlogCategory };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/* ─── URL helpers ─── */

export const BLOG_URL = `${SITE_URL}/blog`;
export const blogPostUrl = (slug: string) => `${SITE_URL}/blog/${slug}`;
export const blogCategoryUrl = (slug: string) => `${SITE_URL}/blog/kategori/${slug}`;

// Halaman 1 selalu URL bersih; halaman dalam pakai ?page=n (§8.3).
export function pagedUrl(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/* ─── Teks turunan ─── */

export function blogAuthorName(post: Pick<BlogPost, 'author_name'>): string {
  return post.author_name?.trim() || SITE_NAME;
}

// Meta description: override → excerpt → potongan body. Target 140–160,
// hard limit 160 (§8.2, logika sama seperti treatments/[slug]).
export function blogMetaDescription(post: BlogPost): string {
  const source =
    post.meta_description?.trim() ||
    post.excerpt?.trim() ||
    markdownToPlainText(post.content_source);

  if (!source) return `${post.title} — Drips To You - Bali, mobile IV therapy delivered across Bali.`;
  if (source.length <= 160) return source;
  return `${source.slice(0, 157).trimEnd()}…`;
}

// Title tag: override → "{title} | Drips To You - Bali" (§8.2).
export function blogMetaTitle(post: Pick<BlogPost, 'title' | 'meta_title'>): string {
  const override = post.meta_title?.trim();
  return override || `${post.title} | ${SITE_NAME}`;
}

// "2026-07-20 09:00:00" → ISO untuk JSON-LD / OpenGraph.
export function toIsoOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function formatBlogDate(value: string | null | undefined, lang: 'id' | 'en' = 'en'): string {
  const iso = toIsoOrNull(value);
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  });
}
