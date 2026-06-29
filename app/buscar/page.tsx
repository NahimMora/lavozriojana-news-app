import type { Metadata } from 'next';
import { BannerAd } from '@/components/news/BannerAd';
import { Pagination } from '@/components/news/Pagination';
import { PostCard } from '@/components/news/PostCard';
import { searchPosts } from '@/lib/posts';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = {
  searchParams: { q?: string; page?: string };
};

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q?.trim();
  return {
    title: q ? `Buscar: ${q}` : 'Buscar',
    alternates: {
      canonical: absoluteUrl('/buscar')
    },
    robots: {
      index: false,
      follow: true
    }
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q || '').trim();
  const page = Math.max(1, Number(searchParams.page || 1));
  const perPage = 12;
  const result = q ? await searchPosts(q, page, perPage) : { posts: [], total: 0 };

  return (
    <div className="container section">
      <BannerAd slot="SEARCH_TOP" />
      <h1 className="section-title">Buscar</h1>
      <form className="search-form" action="/buscar" role="search" style={{ maxWidth: 620 }}>
        <input type="search" name="q" defaultValue={q} placeholder="Buscar por título, categoría, autor o tag" />
        <button type="submit">Buscar</button>
      </form>
      {q && (
        <p className="muted">
          {result.total === 0 ? 'No se encontraron resultados' : `${result.total} resultado(s) para "${q}"`}
        </p>
      )}
      <div className="editorial-grid section">
        {result.posts.map((post) => (
          <PostCard post={post} key={post.id} />
        ))}
      </div>
      {q && <Pagination page={page} perPage={perPage} total={result.total} basePath="/buscar" query={{ q }} />}
    </div>
  );
}
