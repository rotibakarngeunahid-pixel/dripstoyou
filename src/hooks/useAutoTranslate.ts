'use client';

import { useEffect, useState } from 'react';
import { translateTextsOffline, type TranslationLang } from '@/lib/offline-translate';

const CACHE_VERSION = 'v2';

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
    // Storage full or unavailable.
  }
}

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

  useEffect(() => {
    const normed = normalize(texts);
    const target: TranslationLang = targetLang === 'en' ? 'en' : 'id';
    const sKey = `trans_${CACHE_VERSION}_${cacheKey}_${target}_${textsHash}`;

    const cached = readCache(sKey);
    if (cached && cached.length === texts.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        data: cached.map(t => (t === '__null__' ? null : t)),
        loading: false,
      });
      return;
    }

    const nonNulls = normed.filter((t): t is string => t !== null);
    if (!nonNulls.length) {
      setState({ data: normed, loading: false });
      return;
    }

    try {
      const translations = translateTextsOffline(nonNulls, target, 'auto');
      let i = 0;
      const result: (string | null)[] = normed.map(t =>
        t === null ? null : (translations[i++] ?? t),
      );
      writeCache(sKey, result.map(t => (t === null ? '__null__' : t)));
      setState({ data: result, loading: false });
    } catch {
      setState({ data: normed, loading: false });
    }
    // deps: cacheKey + targetLang + textsHash covers all inputs without needing texts reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, targetLang, textsHash]);

  const normed = normalize(texts);
  return {
    translated: state.data ?? normed,
    loading: state.loading,
  };
}
