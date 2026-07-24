// Nama cookie & header CSRF — dipisah dari src/lib/csrf.ts supaya kode client
// bisa mengimpornya tanpa ikut menarik `node:crypto` / `next/headers`.

export const CSRF_COOKIE = 'drip_csrf';
export const CSRF_HEADER = 'x-csrf-token';
