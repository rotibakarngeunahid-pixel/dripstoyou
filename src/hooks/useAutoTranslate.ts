'use client';

import { useState, useEffect, useRef } from 'react';

const CACHE_VERSION = 'v1';

function djb2Hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(36).slice(0, 8);
}

function normalize(texts: (string | null | undefined)[]): (string | null)[] {
  return texts.map(t => (t == null || (t as string).trim() === '' ? null : t as string));
}

function readCache(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — ignore
  }
}

/**
 * Translates an array of texts from Indonesian to the given targetLang.
 *
 * - targetLang === 'id': returns original texts immediately, no fetch
 * - Cache key includes a content hash so stale content auto-invalidates
 * - Returns loading=true while fetch is in progress → caller should show skeletons
 * - Falls back to original texts on any error
 */
export function useAutoTranslate(
  texts: (string | null | undefined)[],
  targetLang: string,
  cacheKey: string,
): { translated: (string | null)[]; loading: boolean } {
  const textsHash = djb2Hash(texts.map(t => t ?? '').join('|||'));

  const [state, setState] = useState<{ data: (string | null)[] | null; loading: boolean }>({
    data: null,
    loading: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const normed = normalize(texts);

    // Source language — no translation needed
    if (targetLang === 'id') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ data: normed, loading: false });
      return;
    }

    const sKey = `trans_${CACHE_VERSION}_${cacheKey}_${targetLang}_${textsHash}`;

    // Serve from cache if available and length matches
    const cached = readCache(sKey);
    if (cached && cached.length === texts.length) {
      setState({
        data: cached.map(t => (t === '__null__' ? null : t)),
        loading: false,
      });
      return;
    }

    // Filter non-null texts for the API call
    const nonNulls = normed.filter((t): t is string => t !== null);
    if (!nonNulls.length) {
      setState({ data: normed, loading: false });
      return;
    }

    // Start loading (triggers skeleton display in consuming component)
    setState({ data: null, loading: true });

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: nonNulls, targetLang }),
      signal: ctrl.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ translations?: string[] }>;
      })
      .then(({ translations = nonNulls }) => {
        let i = 0;
        const result: (string | null)[] = normed.map(t =>
          t === null ? null : (translations[i++] ?? t),
        );
        writeCache(sKey, result.map(t => (t === null ? '__null__' : t)));
        setState({ data: result, loading: false });
      })
      .catch(err => {
        if ((err as Error).name === 'AbortError') return;
        // Graceful fallback to originals
        setState({ data: normed, loading: false });
      });

    return () => {
      ctrl.abort();
    };
    // deps: cacheKey + targetLang + textsHash covers all inputs without needing texts reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, targetLang, textsHash]);

  const normed = normalize(texts);
  return {
    translated: state.data ?? normed,
    loading: state.loading || (targetLang !== 'id' && state.data === null),
  };
}
