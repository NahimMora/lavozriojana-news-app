'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

export type TickerItem = {
  id: string;
  href: string;
  title: string;
  time: string;
  dateTime?: string;
  /** The feed's urgent story: first in the strip and marked as such. */
  urgent?: boolean;
};

/* Constant reading speed whatever the screen or the amount of content. */
const PIXELS_PER_SECOND = 60;
const MIN_SECONDS = 12;

/**
 * Moving strip of headlines. Two identical lists, each at least as wide as
 * the strip, make the loop seamless (-50%). The duration comes from the
 * measured width of one list, so a short list does not race across a wide
 * screen and a long one does not crawl. The pause button (WCAG 2.2.2) keeps
 * it still until the reader resumes it.
 */
export function BreakingTicker({ items, initialSeconds }: { items: TickerItem[]; initialSeconds: number }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const width = list.getBoundingClientRect().width;
      if (width > 0) setSeconds(Math.max(MIN_SECONDS, Math.round(width / PIXELS_PER_SECOND)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items]);

  const list = (copy: boolean) => (
    // The second copy only closes the visual loop: hidden from assistive
    // technology and out of the tab order.
    <ul className="breaking-items" aria-hidden={copy || undefined} ref={copy ? undefined : listRef}>
      {items.map((item) => (
        <li key={item.id} className={item.urgent ? 'is-urgent' : undefined}>
          <Link href={item.href} tabIndex={copy ? -1 : undefined}>
            <time dateTime={item.dateTime}>{item.time}</time>
            <span>{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div
        className={`breaking-ticker${paused ? ' is-paused' : ''}`}
        style={{ '--ticker-duration': `${seconds}s` } as CSSProperties}
      >
        <div className="breaking-track">
          {list(false)}
          {list(true)}
        </div>
      </div>
      <button
        type="button"
        className="ticker-toggle"
        aria-label={paused ? 'Reanudar titulares en movimiento' : 'Pausar titulares en movimiento'}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {paused ? <path d="M7 4.5v15l13-7.5z" /> : <path d="M6 4h4.5v16H6zm7.5 0H18v16h-4.5z" />}
        </svg>
      </button>
    </>
  );
}
