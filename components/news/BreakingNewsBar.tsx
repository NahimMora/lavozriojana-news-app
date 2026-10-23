import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { PublicPost } from '@/lib/posts';
import { formatWireTime } from '@/lib/format';
import { formatHeadline } from '@/lib/headline';
import { TickerPause } from './TickerPause';

/* Below this many characters the line fits on most screens: a moving strip
   would only expose its own gap, so it stays still. */
const MIN_ANIMATED_CHARS = 110;
/* Roughly 70 px/s at the bar's type size, whatever the amount of content. */
const SECONDS_PER_CHAR = 0.11;

export function BreakingNewsBar({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;

  const items = posts.map((post) => ({
    id: post.id,
    href: `/noticias/${post.slug}`,
    title: formatHeadline(post.title, post.excerpt, post.contentText),
    time: formatWireTime(post.publishedAt),
    dateTime: post.publishedAt?.toISOString()
  }));
  const chars = items.reduce((total, item) => total + item.title.length + item.time.length + 6, 0);
  const animated = chars >= MIN_ANIMATED_CHARS;

  const list = (copy: boolean) => (
    // The second copy only closes the visual loop: hidden from assistive
    // technology and out of the tab order.
    <ul className="breaking-items" aria-hidden={copy || undefined}>
      {items.map((item) => (
        <li key={item.id}>
          <Link href={item.href} tabIndex={copy ? -1 : undefined}>
            <time dateTime={item.dateTime}>{item.time}</time>
            <span>{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      className={`breaking-bar${animated ? ' is-animated' : ''}`}
      aria-label="Último momento"
      style={animated ? ({ '--ticker-duration': `${Math.round(chars * SECONDS_PER_CHAR)}s` } as CSSProperties) : undefined}
    >
      <div className="container breaking-inner">
        <span className="breaking-label" aria-hidden="true">
          <span className="breaking-dot" />
          Último momento
        </span>
        <div className="breaking-ticker">
          <div className="breaking-track">
            {list(false)}
            {animated && list(true)}
          </div>
        </div>
        {animated && <TickerPause />}
      </div>
    </section>
  );
}
