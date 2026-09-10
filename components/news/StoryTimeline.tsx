import { formatDate } from '@/lib/format';

type TimelineItem = {
  id: number;
  slug: string;
  title: string;
  publishedAt: Date | null;
};

/**
 * "Seguí esta historia" (Parte 11/38 del plan de contexto editorial del
 * autopublicador). Sólo se muestra cuando hay al menos 2 publicaciones
 * previas relacionadas — esa regla la aplica el caller (la nota actual
 * nunca aparece en la lista).
 */
export function StoryTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length < 2) return null;

  return (
    <section className="story-timeline-box" aria-label="Seguí esta historia">
      <h2 className="section-title">Seguí esta historia</h2>
      <ol className="story-timeline-list">
        {items.map((item) => (
          <li className="story-timeline-item" key={item.id}>
            <time className="story-timeline-date" dateTime={item.publishedAt?.toISOString()}>
              {formatDate(item.publishedAt)}
            </time>
            <a className="story-timeline-title" href={`/noticias/${item.slug}`}>
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
