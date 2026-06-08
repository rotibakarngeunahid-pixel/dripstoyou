'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';

function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const prevPathRef = useRef('');

  function startBar() {
    if (startedRef.current) return;
    startedRef.current = true;
    setOpacity(1);
    setWidth(12);
    let w = 12;
    intervalRef.current = setInterval(() => {
      w = Math.min(w + (82 - w) * 0.07, 82);
      setWidth(w);
    }, 120);
  }

  function finishBar() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    startedRef.current = false;
    setWidth(100);
    setTimeout(() => {
      setOpacity(0);
      setTimeout(() => setWidth(0), 350);
    }, 220);
  }

  // Start on any internal link click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (
        href.startsWith('http') || href.startsWith('//') ||
        href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || anchor.target === '_blank'
      ) return;
      startBar();
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Finish when pathname changes (navigation completed)
  useEffect(() => {
    const current = pathname + searchParams.toString();
    if (!prevPathRef.current) {
      prevPathRef.current = current;
      return;
    }
    if (current !== prevPathRef.current) {
      prevPathRef.current = current;
      if (startedRef.current) finishBar();
    }
  }, [pathname, searchParams]);

  if (width === 0 && opacity === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        height: 3,
        width: `${width}%`,
        background: 'linear-gradient(90deg, var(--gold, #C9944C), #e8b870)',
        zIndex: 10000,
        opacity,
        transition: width >= 100
          ? 'width 0.22s ease, opacity 0.35s ease 0.22s'
          : width === 0
          ? 'none'
          : 'width 0.45s ease',
        boxShadow: '0 0 10px rgba(201,148,76,0.55), 0 0 4px rgba(201,148,76,0.35)',
        pointerEvents: 'none',
        borderRadius: '0 2px 2px 0',
      }}
    />
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
