// Shared formatting helpers for the CRM UI.

const RP = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** "Rp 1.250.000" — dot separator, no decimals. Accepts number | string | null. */
export function formatRupiah(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return 'Rp 0';
  return `Rp ${RP.format(Math.round(n))}`;
}

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_ID_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** "YYYY-MM" -> "Juli 2026" */
export function formatMonthYear(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return `${MONTHS_ID_FULL[m - 1] ?? ''} ${y}`;
}

function parseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(String(input).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "26 Jun 2026" */
export function formatDate(input: string | Date | null | undefined): string {
  const d = parseDate(input);
  if (!d) return '-';
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** "26 Jun 2026 · 10:00 WITA" */
export function formatDateTimeWITA(input: string | Date | null | undefined): string {
  const d = parseDate(input);
  if (!d) return '-';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} · ${hh}:${mm} WITA`;
}

/** "26 Jun · 10:00" — compact, for cards/tables */
export function formatDayTime(dateInput: string | Date | null | undefined, time?: string | null): string {
  const d = parseDate(dateInput);
  if (!d) return '-';
  const left = `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`;
  return time ? `${left} · ${time}` : left;
}

export function initials(name?: string | null): string {
  const clean = name?.trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || clean[0].toUpperCase();
}
