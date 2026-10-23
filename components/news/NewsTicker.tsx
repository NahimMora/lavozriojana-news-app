'use client';

import { useState } from 'react';
import Link from 'next/link';

type Item = { slug: string; title: string; time: string; dateTime?: string };

export function NewsTicker({ items }: { items: Item[] }) {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`breaking-bar${paused ? ' is-paused' : ''}`} role="region" aria-label="Último momento">
      <div className="container breaking-inner">
        <span className="breaking-label"><span className="breaking-dot" />Último momento</span>
        <div className="breaking-ticker">
          <div className="breaking-track">
            {[0, 1].map(copy => (
              <div className="breaking-items" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                {items.map(item => (
                  <Link href={`/noticias/${item.slug}`} key={item.slug} tabIndex={copy === 1 ? -1 : undefined}>
                    <time dateTime={item.dateTime}>{item.time}</time><span>{item.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="ticker-toggle" aria-label={paused ? 'Reanudar titulares' : 'Pausar titulares'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{paused ? <path d="m8 5 11 7-11 7z" /> : <path d="M6 5h4v14H6zm8 0h4v14h-4z" />}</svg>
        </button>
      </div>
    </div>
  );
}
