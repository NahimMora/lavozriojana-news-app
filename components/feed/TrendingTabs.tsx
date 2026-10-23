'use client';

import Link from 'next/link';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { TrendingStory } from '@/lib/feed';

function TrendingList({ stories }: { stories: TrendingStory[] }) {
  return (
    <ol className="trending-list">
      {stories.map((story, index) => (
        <li key={story.slug}>
          <span className="trending-rank" aria-hidden="true">
            {index + 1}
          </span>
          <div>
            {story.category && (
              <Link className="kicker" href={`/categoria/${story.category.slug}`}>
                {story.category.name}
              </Link>
            )}
            <Link className="trending-title" href={story.path}>
              {story.title}
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}

type Tab = { id: 'day' | 'week'; label: string; stories: TrendingStory[] };

/**
 * "Lo más visto en Instagram": reach on the outlet's Instagram account, not
 * visits to the site (that is "Más leídas"). Both lists come rendered from
 * the server; the tabs only switch which one is visible (ARIA tabs pattern).
 */
export function TrendingTabs({ day, week, title = 'Lo más visto en Instagram' }: { day: TrendingStory[]; week: TrendingStory[]; title?: string | null }) {
  const tabs: Tab[] = [
    { id: 'day' as const, label: 'Hoy', stories: day },
    { id: 'week' as const, label: 'Semana', stories: week }
  ].filter((tab) => tab.stories.length > 0);
  const [active, setActive] = useState(tabs[0]?.id ?? 'day');
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  if (!tabs.length) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next = -1;
    if (event.key in keys) next = (index + keys[event.key] + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <section className="trending" aria-labelledby={title ? `${base}-titulo` : undefined} aria-label={title ? undefined : 'Lo más visto en Instagram'}>
      <div className="trending-head">
        {title && (
          <h3 className="trending-heading" id={`${base}-titulo`}>
            {title}
          </h3>
        )}
        {tabs.length > 1 ? (
          <div className="trending-tabs" role="tablist" aria-label="Período">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${base}-tab-${tab.id}`}
                aria-selected={active === tab.id}
                aria-controls={`${base}-panel-${tab.id}`}
                tabIndex={active === tab.id ? 0 : -1}
                onClick={() => setActive(tab.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="trending-period">{tabs[0].id === 'day' ? 'Hoy' : 'Últimos 7 días'}</span>
        )}
      </div>
      <p className="trending-note">Según el alcance de nuestras publicaciones en Instagram.</p>
      {tabs.length > 1
        ? tabs.map((tab) => (
            <div key={tab.id} role="tabpanel" id={`${base}-panel-${tab.id}`} aria-labelledby={`${base}-tab-${tab.id}`} hidden={active !== tab.id}>
              <TrendingList stories={tab.stories} />
            </div>
          ))
        : <TrendingList stories={tabs[0].stories} />}
    </section>
  );
}
