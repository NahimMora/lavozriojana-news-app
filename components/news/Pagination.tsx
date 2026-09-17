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
    if (targetPage > 1) params.set('page', String(targetPage));
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
    }
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="pagination" aria-label="Paginación">
      {prevDisabled ? (
        <span className="pagination-btn" aria-disabled="true">
          <ChevronLeft /> Anterior
        </span>
      ) : (
        <Link className="pagination-btn" href={hrefFor(page - 1)}>
          <ChevronLeft /> Anterior
        </Link>
      )}

      <span className="pagination-count">
        Página <strong>{page}</strong> de {totalPages}
      </span>

      {nextDisabled ? (
        <span className="pagination-btn" aria-disabled="true">
          Siguiente <ChevronRight />
        </span>
      ) : (
        <Link className="pagination-btn" href={hrefFor(page + 1)}>
          Siguiente <ChevronRight />
        </Link>
      )}
    </nav>
  );
}

function ChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
