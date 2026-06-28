'use client';

// Client-side helpers for talking to the CRM Next API routes.
// The PHP backend wraps responses as { success, message, data }. These helpers
// unwrap that and throw a friendly Error (Bahasa Indonesia) on failure.

type Envelope<T> = { success?: boolean; message?: string; error?: string; data?: T };

async function parse<T>(res: Response): Promise<Envelope<T>> {
  try {
    return (await res.json()) as Envelope<T>;
  } catch {
    return { success: false, message: 'Respons server tidak valid' };
  }
}

function errMessage(json: Envelope<unknown>, fallback: string): string {
  return json.error ?? json.message ?? fallback;
}

/** GET a CRM endpoint and return the unwrapped `data`. */
export async function crmGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' });
  const json = await parse<T>(res);
  if (!res.ok) throw new Error(errMessage(json, 'Gagal memuat data'));
  return json.data as T;
}

/** Send a JSON body with the given method; returns the full envelope. */
export async function crmSend<T = unknown>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<Envelope<T>> {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await parse<T>(res);
  if (!res.ok || json.success === false) throw new Error(errMessage(json, 'Gagal menyimpan'));
  return json;
}
