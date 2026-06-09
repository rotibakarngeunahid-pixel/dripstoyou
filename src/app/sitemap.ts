import type { MetadataRoute } from 'next';

const BASE_URL = 'https://dripstoyou.com';

type TreatmentEntry = { slug: string; updatedAt?: string };

async function fetchTreatmentSlugs(): Promise<TreatmentEntry[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}/products.php`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json() as { data?: TreatmentEntry[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/treatments`,    lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/booking`,       lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`,       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/faq`,           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/cek-booking`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
  ];

  const treatments = await fetchTreatmentSlugs();
  const treatmentPages: MetadataRoute.Sitemap = treatments.map((t) => ({
    url: `${BASE_URL}/treatments/${t.slug}`,
    lastModified: t.updatedAt ?? now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...treatmentPages];
}
