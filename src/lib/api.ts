// ─────────────────────────────────────────────────────────────────────────────
// PHP API fetch helper
// Base URL: process.env.NEXT_PUBLIC_API_BASE_URL  (e.g. https://domain.com/api)
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

if (!API_BASE && typeof window === 'undefined') {
  // Warn at build time if env var is missing
  console.warn('[api.ts] NEXT_PUBLIC_API_BASE_URL is not set');
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ── Generic fetch wrapper ─────────────────────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  baseOverride?: string,
): Promise<{ ok: boolean; status: number; data: ApiResponse<T> }> {
  const base = baseOverride ?? API_BASE;
  const url  = `${base}/${path.replace(/^\//, '')}`;

  try {
    const res  = await fetch(url, { ...options, cache: options.cache ?? 'no-store' });
    const data = await res.json() as ApiResponse<T>;
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok:     false,
      status: 503,
      data:   { success: false, message: 'Network error: could not reach API' },
    };
  }
}

// ── Admin fetch (adds Bearer token) ──────────────────────────────────────────

export function adminFetch<T = unknown>(
  path: string,
  token: string,
  options: RequestInit = {},
) {
  return apiFetch<T>(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

// ── Public helpers (used by server components & client components) ────────────

export async function fetchPublicProducts(opts?: {
  slug?: string;
  includeBenefits?: boolean;
  includeFaqs?: boolean;
}) {
  const params = new URLSearchParams();
  if (opts?.slug) params.set('slug', opts.slug);
  if (opts?.includeBenefits) params.set('include_benefits', '1');
  if (opts?.includeFaqs) params.set('include_faqs', '1');
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`products.php${qs}`);
}

export async function fetchPublicAreas() {
  return apiFetch('areas.php');
}

export async function fetchPublicSettings() {
  return apiFetch('settings.php');
}

export async function checkAvailability(date: string) {
  return apiFetch(`availability.php?date=${encodeURIComponent(date)}`);
}

export async function createBooking(payload: Record<string, unknown>) {
  return apiFetch('bookings.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
