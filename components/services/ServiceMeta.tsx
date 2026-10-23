import { formatAge, formatUpdated, VOLATILE_FRESH } from '@/lib/feed-select';

/**
 * Source and update time of a service block, as the feed gives them. Past
 * `freshMs` the age is spelled out, so old data never reads as current.
 */
export function ServiceMeta({
  source,
  updated,
  now,
  freshMs = VOLATILE_FRESH,
  label = 'Actualizado'
}: {
  source: string;
  updated: string;
  now: Date;
  freshMs?: number;
  label?: string;
}) {
  const aging = now.getTime() - Date.parse(updated) > freshMs;
  return (
    <p className={`service-meta${aging ? ' is-aging' : ''}`}>
      Fuente: {source} · {label}: {formatUpdated(updated, now)}
      {aging && <strong> ({formatAge(updated, now)})</strong>}
    </p>
  );
}
