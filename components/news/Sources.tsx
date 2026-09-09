import type { PostSource, SourceType } from '@prisma/client';

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  OFICIAL: 'Fuente oficial',
  ORGANISMO_PUBLICO: 'Organismo público',
  MEDIO: 'Medio citado',
  COMUNICADO: 'Comunicado',
  ENTREVISTA: 'Entrevista',
  DOCUMENTO: 'Documento',
  REDES_SOCIALES: 'Redes sociales verificadas',
  ELABORACION_PROPIA: 'Elaboración propia'
};

type LegacySource = { name: string | null; url: string | null };

export function Sources({ sources, legacy }: { sources: PostSource[]; legacy?: LegacySource }) {
  const items: Array<{ id: string | number; name: string; url: string | null; type: SourceType }> =
    sources.length > 0
      ? sources.map((source) => ({ id: source.id, name: source.name, url: source.url, type: source.type }))
      : legacy?.name
        ? [{ id: 'legacy', name: legacy.name, url: legacy.url, type: 'MEDIO' as SourceType }]
        : [];

  if (items.length === 0) return null;

  return (
    <section className="sources-box" aria-label="Fuentes consultadas">
      <h2 className="section-title">Fuentes consultadas</h2>
      <ul className="sources-list">
        {items.map((item) => (
          <li key={item.id}>
            <span className="sources-type">{SOURCE_TYPE_LABELS[item.type]}</span>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer nofollow">
                {item.name}
              </a>
            ) : (
              <span>{item.name}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
