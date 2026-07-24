import type { MetadataRoute } from 'next';

const BASE_URL = 'https://dripstoyou.com';

type TreatmentEntry = { slug: string; updated_at?: string | null };

type BlogEntry = { slug: string; updated_at?: string | null; published_at?: string | null };
type BlogCategoryEntry = { slug: string };

// Tanpa base URL, `fetch('/products.php')` bukan no-op: Next.js menyelesaikannya
// terhadap host build sendiri dan menggantung sampai timeout — cukup untuk
// menggagalkan build sitemap. Selalu bail out lebih dulu.
function apiBase(): string | null {
  return process.env.NEXT_PUBLIC_API_BASE_URL || null;
}

const FETCH_TIMEOUT_MS = 6000;

async function fetchTreatmentSlugs(): Promise<TreatmentEntry[]> {
  const base = apiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/products.php`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const json = await res.json() as { data?: TreatmentEntry[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

// blog.php hanya mengembalikan artikel published & published_at <= NOW(), jadi
// draft/scheduled/archived tidak pernah bisa masuk sitemap. Jangan pernah
// mengganti sumbernya dengan query tabel mentah.
async function fetchBlogSlugs(): Promise<BlogEntry[]> {
  const base = apiBase();
  if (!base) return [];

  const perPage = 50;
  const maxPages = 10; // pagar aman: 500 artikel, tetap jauh di bawah timeout build
  const entries: BlogEntry[] = [];

  try {
    for (let page = 1; page <= maxPages; page += 1) {
      const res = await fetch(`${base}/blog.php?page=${page}&per_page=${perPage}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) break;
      const json = await res.json() as {
        data?: { items?: BlogEntry[]; pagination?: { totalPages?: number } };
      };
      const items = json.data?.items;
      if (!Array.isArray(items) || items.length === 0) break;
      entries.push(...items);
      if (page >= (json.data?.pagination?.totalPages ?? 1)) break;
    }
  } catch {
    return entries;
  }

  return entries;
}

async function fetchBlogCategorySlugs(): Promise<BlogCategoryEntry[]> {
  const base = apiBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/blog-categories.php`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const json = await res.json() as { data?: BlogCategoryEntry[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

function toIsoDate(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/treatments`,                  lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/booking`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/blog`,                        lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/about`,                       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/faq`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/legal/terms-conditions`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/privacy-policy`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];

  const [treatments, blogPosts, blogCategories] = await Promise.all([
    fetchTreatmentSlugs(),
    fetchBlogSlugs(),
    fetchBlogCategorySlugs(),
  ]);

  const treatmentPages: MetadataRoute.Sitemap = treatments
    .filter((t) => typeof t.slug === 'string' && t.slug.length > 0)
    .map((t) => ({
      url: `${BASE_URL}/treatments/${t.slug}`,
      lastModified: toIsoDate(t.updated_at, now),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // Hanya URL kanonik artikel — halaman paginasi (?page=n) sengaja tidak masuk.
  const blogPostPages: MetadataRoute.Sitemap = blogPosts
    .filter((p) => typeof p.slug === 'string' && p.slug.length > 0)
    .map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: toIsoDate(p.updated_at ?? p.published_at, now),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const blogCategoryPages: MetadataRoute.Sitemap = blogCategories
    .filter((c) => typeof c.slug === 'string' && c.slug.length > 0)
    .map((c) => ({
      url: `${BASE_URL}/blog/kategori/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  return [...staticPages, ...treatmentPages, ...blogPostPages, ...blogCategoryPages];
}
