// Shared client-side helpers/types for the admin Blog Analytics dashboard
// (dashboard + per-article detail both use these — avoids duplicating the
// date-range/fetch logic across the two client components).

export type RangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';
export type Granularity = 'day' | 'week' | 'month';
export type SortKey = 'views' | 'clicks' | 'recent' | 'least';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function presetRange(preset: RangePreset, customFrom: string, customTo: string): { from: string; to: string } {
  const today = todayStr();
  if (preset === 'custom') return { from: customFrom || today, to: customTo || today };
  if (preset === 'today') return { from: today, to: today };
  const days = preset === '7d' ? 6 : preset === '90d' ? 89 : 29;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to: today };
}

export async function fetchBlogAnalytics<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/admin/blog-analytics?${qs}`, { cache: 'no-store' });
  let json: { success?: boolean; data?: T; message?: string; error?: string } | null = null;
  try {
    json = await res.json();
  } catch {
    // fall through to the generic error below
  }
  if (!res.ok || !json?.success) {
    throw new Error(json?.message ?? json?.error ?? 'Gagal memuat data analytics.');
  }
  return json.data as T;
}

export interface BlogOverviewData {
  totalArticles: number;
  totalPublished: number;
  totalViews: number;
  totalUniqueVisitors: number;
  totalInteractions: number;
  avgViewsPerArticle: number;
  topArticle: { id: string; title: string; slug: string; views: number } | null;
  viewsToday: number;
  views7d: number;
  views30d: number;
  growthPct: number | null;
}

export interface BlogTopArticleRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  views: number;
  uniqueVisitors: number;
  clicks: number;
  lastViewedAt: string | null;
}

export interface BlogTopResponse {
  items: BlogTopArticleRow[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
}

export interface BlogBreakdownItem {
  label: string;
  count: number;
}

export interface BlogPostDetailResponse {
  post: { id: string; title: string; slug: string; status: string; publishedAt: string | null };
  performance: {
    views: number;
    uniqueVisitors: number;
    interactions: number;
    viewsToday: number;
    views7d: number;
    views30d: number;
  };
  series: { date: string; views: number; uniqueVisitors: number }[];
  breakdowns: {
    device: BlogBreakdownItem[];
    browser: BlogBreakdownItem[];
    os: BlogBreakdownItem[];
    referrer: BlogBreakdownItem[];
    country: BlogBreakdownItem[];
  };
}

export function formatCompact(n: number): string {
  return n.toLocaleString('id-ID');
}

export function formatDateLabel(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
