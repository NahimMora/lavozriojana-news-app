import type { Metadata } from 'next';
import { Pagination } from '@/components/news/Pagination';
import { PostCard } from '@/components/news/PostCard';
import { searchPosts } from '@/lib/posts';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = { searchParams: { q?: string; page?: string } };

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q?.trim();
  return {
    title: q ? `Buscar: ${q}` : 'Buscar',
    alternates: { canonical: absoluteUrl('/buscar') },
    robots: { index: false, follow: true }
  };
}

const SUGGESTIONS = ['Política', 'Interior', 'Salud', 'Deportes', 'Economía', 'Cultura', 'Sociedad'];

const IconSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q || '').trim();
  const page = Math.max(1, Number(searchParams.page || 1));
  const perPage = 12;
  const result = q ? await searchPosts(q, page, perPage) : { posts: [], total: 0 };

  return (
    <div className="container search-page">
      {/* Hero */}
      <div className="search-hero">
        <h1>Buscar noticias</h1>
        <p>Encontrá noticias, categorías y temas de La Voz Riojana.</p>

        <form className="search-form search-form-lg" action="/buscar" role="search">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Escribí un tema, nombre o categoría…"
            aria-label="Buscar noticias"
            autoFocus={!q}
            autoComplete="off"
          />
          <button type="submit" aria-label="Buscar">
            <IconSearch />
            <span className="search-form-lg-label">Buscar</span>
          </button>
        </form>
      </div>

      {/* Sin query: sugerencias */}
      {!q && (
        <div className="search-suggestions">
          <p>Temas populares</p>
          <div className="search-tags">
            {SUGGESTIONS.map((tag) => (
              <a href={`/buscar?q=${encodeURIComponent(tag)}`} className="search-tag" key={tag}>
                {tag}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Con query: meta */}
      {q && (
        <p className="search-meta">
          {result.total === 0 ? (
            <>Sin resultados para <strong>&ldquo;{q}&rdquo;</strong></>
          ) : (
            <><strong>{result.total}</strong> resultado{result.total !== 1 ? 's' : ''} para <strong>&ldquo;{q}&rdquo;</strong></>
          )}
        </p>
      )}

      {/* Sin resultados: empty state */}
      {q && result.total === 0 && (
        <div className="search-empty">
          <IconSearch />
          <h2>No encontramos resultados</h2>
          <p>Revisá la ortografía o probá con otro término.</p>
          <p>Sugerencias:</p>
          <div className="search-tags">
            {SUGGESTIONS.map((tag) => (
              <a href={`/buscar?q=${encodeURIComponent(tag)}`} className="search-tag" key={tag}>
                {tag}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      {result.posts.length > 0 && (
        <>
          <div className="editorial-grid">
            {result.posts.map((post) => (
              <PostCard post={post} key={post.id} />
            ))}
          </div>
          <Pagination page={page} perPage={perPage} total={result.total} basePath="/buscar" query={{ q }} />
        </>
      )}
    </div>
  );
}
