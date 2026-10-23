'use client';

import { useState } from 'react';

/** Pausa explícita del ticker (WCAG 2.2.2). Hover y foco ya lo detienen por
 * CSS; este botón lo deja quieto hasta que el lector decida reanudarlo. */
export function TickerPause() {
  const [paused, setPaused] = useState(false);

  return (
    <button
      type="button"
      className="ticker-toggle"
      aria-label={paused ? 'Reanudar titulares en movimiento' : 'Pausar titulares en movimiento'}
      onClick={(event) => {
        const next = !paused;
        event.currentTarget.closest('.breaking-bar')?.classList.toggle('is-paused', next);
        setPaused(next);
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {paused ? <path d="M7 4.5v15l13-7.5z" /> : <path d="M6 4h4.5v16H6zm7.5 0H18v16h-4.5z" />}
      </svg>
    </button>
  );
}
