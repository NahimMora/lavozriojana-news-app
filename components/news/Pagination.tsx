import Link from 'next/link';

export function Pagination({
  page,
  perPage,
  total,
  basePath,
  query
}: {
  page: number;
  perPage: number;
  total: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set('page', String(targetPage));
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
    }
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav className="pagination" aria-label="Paginación">
      {page > 1 ? <Link href={hrefFor(page - 1)}>Anterior</Link> : <span>Anterior</span>}
      <span>
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? <Link href={hrefFor(page + 1)}>Siguiente</Link> : <span>Siguiente</span>}
    </nav>
  );
}
