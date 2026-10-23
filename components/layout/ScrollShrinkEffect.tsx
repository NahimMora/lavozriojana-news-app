'use client';

import { useEffect } from 'react';

/** Compacts the fixed header after the reader scrolls past the masthead.
 * The header has a spacer of constant height behind it (Header.tsx), so the
 * change never shifts content; the two thresholds keep it from flickering
 * around a single scroll position. */
const COMPACT_AFTER = 96;
const EXPAND_BEFORE = 24;

export function ScrollShrinkEffect() {
  useEffect(() => {
    const header = document.querySelector('.site-header') as HTMLElement | null;
    if (!header) return;

    let frame: number | null = null;
    const update = () => {
      frame = null;
      const y = window.scrollY;
      if (y > COMPACT_AFTER) header.classList.add('is-shrunk');
      else if (y < EXPAND_BEFORE) header.classList.remove('is-shrunk');
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
