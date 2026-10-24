import type { UrgentStory } from '@/lib/feed';
import type { PublicPost } from '@/lib/posts';
import { formatWireTime } from '@/lib/format';
import { formatHeadline } from '@/lib/headline';
import { BreakingTicker, type TickerItem } from './BreakingTicker';

/* Server estimate of the loop until the browser measures it (~60 px/s at
   the bar's type size, never under 12 s). */
const SECONDS_PER_CHAR = 0.11;
const MIN_SECONDS = 12;

/**
 * "Último momento". It always moves, on every screen, whatever the amount
 * of headlines. The feed's urgent story, when there is one, opens the strip
 * marked as urgent and is not repeated among the rest.
 */
export function BreakingNewsBar({ posts, pinned = null }: { posts: PublicPost[]; pinned?: UrgentStory | null }) {
  const rest = pinned ? posts.filter((post) => post.slug !== pinned.slug) : posts;

  const items: TickerItem[] = [
    ...(pinned ? [{ id: `urgent-${pinned.slug}`, href: pinned.path, title: pinned.title, time: pinned.time, dateTime: pinned.dateTime, urgent: true }] : []),
    ...rest.map((post) => ({
      id: String(post.id),
      href: `/noticias/${post.slug}`,
      title: formatHeadline(post.title, post.excerpt, post.contentText),
      time: formatWireTime(post.publishedAt),
      dateTime: post.publishedAt?.toISOString()
    }))
  ];
  if (!items.length) return null;

  const chars = items.reduce((total, item) => total + item.title.length + item.time.length + 6, 0);

  return (
    <section className="breaking-bar" aria-label="Último momento">
      <div className="container breaking-inner">
        <span className="breaking-label" aria-hidden="true">
          <span className="breaking-dot" />
          Último momento
        </span>
        <BreakingTicker items={items} initialSeconds={Math.max(MIN_SECONDS, Math.round(chars * SECONDS_PER_CHAR))} />
      </div>
    </section>
  );
}
