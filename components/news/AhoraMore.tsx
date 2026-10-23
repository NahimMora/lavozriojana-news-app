'use client';

import { useState } from 'react';

/** En móvil "Ahora" muestra las primeras entradas; este botón despliega el
 * resto sin salir de la portada. En escritorio no se renderiza visualmente. */
export function AhoraMore({ count, listId }: { count: number; listId: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      className="ahora-more"
      aria-expanded={expanded}
      aria-controls={listId}
      onClick={(event) => {
        const next = !expanded;
        event.currentTarget.closest('.ahora-block')?.classList.toggle('is-expanded', next);
        setExpanded(next);
      }}
    >
      {expanded ? 'Mostrar menos' : `Ver ${count} más`}
    </button>
  );
}
