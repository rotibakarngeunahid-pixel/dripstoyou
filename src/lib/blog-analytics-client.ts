// Client-only helpers for first-party blog analytics. Fire-and-forget by
// design: a failed/blocked beacon must never surface as an error or slow
// down the article page. No PII — `visitor_id` is a random opaque cookie
// value, never derived from IP/UA/account data.

const VISITOR_COOKIE = 'dty_vid';
const VISITOR_COOKIE_MAX_AGE_DAYS = 365;
const TRACK_ENDPOINT = '/api/public/blog-track';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === 'undefined') return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateVisitorId(): string {
  const existing = readCookie(VISITOR_COOKIE);
  if (existing) return existing;
  const id = randomId();
  writeCookie(VISITOR_COOKIE, id, VISITOR_COOKIE_MAX_AGE_DAYS);
  return id;
}

export type BlogEventType = 'view' | 'cta_click' | 'link_click';

type BlogEventMeta = Record<string, string | number | boolean>;

/**
 * Fire-and-forget analytics beacon. Uses `navigator.sendBeacon` (survives
 * navigation, e.g. an outbound link click) with a `fetch(keepalive)`
 * fallback. Wrapped so it can never throw into the caller.
 */
export function trackBlogEvent(postId: string, eventType: BlogEventType, meta?: BlogEventMeta): void {
  try {
    const payload = JSON.stringify({
      postId,
      eventType,
      visitorId: getOrCreateVisitorId(),
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      meta: meta ?? undefined,
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(TRACK_ENDPOINT, blob)) return;
    }

    if (typeof fetch === 'function') {
      fetch(TRACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Swallow — tracking must never surface an error to the visitor.
      });
    }
  } catch {
    // Same: never let a tracking failure break the article page.
  }
}
