import { formatDateTime24 } from '@/lib/format';
import { formatHeadline } from '@/lib/headline';
import type { TimelineEntry } from '@/lib/feed-select';

/**
 * "Seguí esta historia": publications of one verified event (storyKey with
 * the `event:` prefix), oldest first, the current story included and
 * marked. The caller builds the entries (buildStoryTimeline) and shows this
 * module instead of "En contexto", never both.
 */
export function StoryTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length < 2) return null;

  return (
    <section className="story-timeline-box" aria-labelledby="story-timeline-title">
      <h2 className="section-title" id="story-timeline-title">Seguí esta historia</h2>
      <ol className="story-timeline-list">
        {entries.map((entry) => {
          const title = formatHeadline(entry.title, entry.excerpt);
          return (
            <li className={`story-timeline-item${entry.current ? ' is-current' : ''}`} key={entry.slug}>
              <time className="story-timeline-date" dateTime={entry.publishedAt}>
                {formatDateTime24(entry.publishedAt)}
              </time>
              {entry.current ? (
                <p className="story-timeline-title" aria-current="page">
                  {title} <span className="story-timeline-here">Estás leyendo esta nota</span>
                </p>
              ) : (
                <a className="story-timeline-title" href={entry.path}>
                  {title}
                </a>
              )}
              {entry.novedad && <p className="story-timeline-news">{entry.novedad}</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
