'use client';

import { useEffect } from 'react';

export default function ScrollRevealInit() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');

    els.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.95) {
        el.setAttribute('data-pending', '1');
      } else {
        el.classList.add('visible');
      }
    });

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.removeAttribute('data-pending');
            (e.target as HTMLElement).classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.04 }
    );

    els.forEach((el) => obs.observe(el));

    const fallback = setTimeout(() => {
      els.forEach((el) => {
        el.removeAttribute('data-pending');
        el.classList.add('visible');
      });
    }, 800);

    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return null;
}
