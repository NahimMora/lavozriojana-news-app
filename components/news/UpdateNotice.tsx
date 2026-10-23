import Link from 'next/link';

/**
 * Shown on an original story that a newer one updates
 * (actualizaciones.json: `nota` → `actualiza`). The link keeps the full
 * title of the update, so it is meaningful out of context too.
 */
export function UpdateNotice({ path, title, novedad }: { path: string; title: string; novedad: string | null }) {
  return (
    <aside className="update-notice" aria-label="Actualización de esta noticia">
      <p className="update-notice-label">Esta noticia tiene una actualización</p>
      {novedad && <p className="update-notice-text">{novedad}</p>}
      <Link className="update-notice-link" href={path}>
        Leé la información actualizada: <span>{title}</span>
      </Link>
    </aside>
  );
}
