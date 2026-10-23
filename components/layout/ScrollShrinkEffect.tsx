'use client';

import { useEffect } from 'react';

export function ScrollShrinkEffect() {
  useEffect(() => {
    const header = document.querySelector('.site-header') as HTMLElement | null;
    if (!header) return;

    let frame: number | null = null;
    const update = () => {
      // Hysteresis prevents toggling when reducing the header shifts the page.
      if (window.scrollY > 120) header.classList.add('is-shrunk');
      else if (window.scrollY < 24) header.classList.remove('is-shrunk');
      frame = null;
    };
    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
