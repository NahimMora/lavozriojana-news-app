import { safeExternalUrl } from '@/lib/feed-url';

export type ArchiveContextEntry = {
  postId?: string;
  title?: string;
  url?: string;
  snippet?: string;
};

function isArchiveContextEntry(value: unknown): value is ArchiveContextEntry {
  return typeof value === 'object' && value !== null;
}

/** Internal path or http(s) URL; anything else (javascript:, data:…) is dropped. */
function safeHref(url: unknown) {
  if (typeof url !== 'string') return undefined;
  if (/^\/(?!\/)/.test(url)) return url;
  return safeExternalUrl(url) ?? undefined;
}

/** Lee post.metadata.archiveContext (JSON libre) de forma defensiva: el
 * autopublicador es un sistema externo y su forma exacta puede variar. */
export function parseArchiveContext(metadata: unknown): ArchiveContextEntry[] {
  if (!metadata || typeof metadata !== 'object') return [];
  const raw = (metadata as Record<string, unknown>).archiveContext;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isArchiveContextEntry)
    .filter((entry) => typeof entry.title === 'string' && typeof entry.snippet === 'string' && entry.title && entry.snippet)
    .map((entry) => ({ ...entry, url: safeHref(entry.url) }));
}

/**
 * "En contexto" (Parte 38): antecedente propio breve cuando NO hay una
 * historia con timeline propio. Nunca ambos módulos juntos (ver
 * app/noticias/[slug]/page.tsx).
 */
export function ArchiveContextNote({ entries }: { entries: ArchiveContextEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="context-note-box" aria-label="En contexto">
      <h2 className="section-title">En contexto</h2>
      <ul className="context-note-list">
        {entries.map((entry, index) => (
          <li className="context-note-item" key={entry.postId || index}>
            <p>{entry.snippet}</p>
            {entry.url && entry.title && (
              <a href={entry.url}>{entry.title}</a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
