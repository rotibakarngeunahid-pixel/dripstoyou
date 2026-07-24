'use client';

// Helper mutation admin sisi browser yang selalu melampirkan token CSRF.
// Token diambil sekali dari /api/admin/csrf lalu di-cache di memori; kalau
// server menolak (403 / token kedaluwarsa) token diambil ulang dan request
// dicoba sekali lagi.

import { CSRF_HEADER } from '@/lib/csrf-constants';

let cachedToken: string | null = null;

async function fetchCsrfToken(force = false): Promise<string> {
  if (cachedToken && !force) return cachedToken;
  const res = await fetch('/api/admin/csrf', { cache: 'no-store' });
  if (!res.ok) throw new Error('CSRF token unavailable');
  const json = (await res.json()) as { token?: string };
  if (!json.token) throw new Error('CSRF token unavailable');
  cachedToken = json.token;
  return cachedToken;
}

export interface AdminMutateResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function adminMutate<T = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<AdminMutateResult<T>> {
  async function send(token: string): Promise<Response> {
    return fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        [CSRF_HEADER]: token,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  try {
    let res = await send(await fetchCsrfToken());
    if (res.status === 403) {
      // Token basi (mis. sesi baru di tab lain) — ambil ulang lalu coba sekali lagi.
      res = await send(await fetchCsrfToken(true));
    }

    let json: unknown = null;
    try { json = await res.json(); } catch { /* body kosong itu wajar untuk DELETE */ }

    const payload = json as { data?: T; error?: string; message?: string } | null;
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: payload?.error ?? payload?.message ?? 'Gagal menyimpan. Coba lagi.',
      };
    }
    return { ok: true, status: res.status, data: payload?.data ?? null, error: null };
  } catch {
    return { ok: false, status: 0, data: null, error: 'Koneksi gagal. Periksa jaringan.' };
  }
}
