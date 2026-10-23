'use client';

import { useEffect } from 'react';

export function ScrollShrinkEffect() {
  useEffect(() => {
    const header = document.querySelector('.site-header') as HTMLElement | null;
    if (!header) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('is-shrunk', window.scrollY > 70);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
}
