'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type RankingTab = { id: string; label: string; note: string | null; panel: ReactNode };

/**
 * One ranking module with two sources kept apart by name and note: visits
 * to the site ("Más leídas") and reach on Instagram. Both panels come
 * rendered from the server; the tabs only switch which one is visible.
 */
export function RankingTabs({ title, tabs }: { title: string; tabs: RankingTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <section className="ranking-tabs" aria-labelledby={`${base}-titulo`}>
      <h2 className="section-title" id={`${base}-titulo`}>
        {title}
      </h2>
      <div className="ranking-tablist" role="tablist" aria-label="Fuente del ranking">
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
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`${base}-panel-${tab.id}`} aria-labelledby={`${base}-tab-${tab.id}`} hidden={active !== tab.id} className="ranking-panel">
          {tab.note && <p className="trending-note">{tab.note}</p>}
          {tab.panel}
        </div>
      ))}
    </section>
  );
}
