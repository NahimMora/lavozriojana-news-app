import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BannerAd } from '@/components/news/BannerAd';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { MostRead } from '@/components/news/MostRead';
import { Pagination } from '@/components/news/Pagination';
import { PostCard } from '@/components/news/PostCard';
import { absoluteUrl } from '@/lib/site';
import { prisma } from '@/lib/prisma';
import { publicPostInclude, type PublicPost } from '@/lib/posts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = {
  params: { slug: string };
  searchParams: { page?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!category) return { title: 'Categoría no encontrada' };
  return {
    title: category.name,
    description: category.description || `Noticias de ${category.name} en La Rioja.`,
    alternates: { canonical: absoluteUrl(`/categoria/${category.slug}`) }
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page || 1));
  const perPage = 12;

  const category = await prisma.category
    .findUnique({ where: { slug: params.slug } })
    .catch(() => null);
  if (!category || !category.isActive) notFound();

  const where = {
    status: 'PUBLISHED' as const,
    publishedAt: { lte: new Date() },
    categoryId: category.id
  };

  const [posts, total, mostRead]: [PublicPost[], number, PublicPost[]] = await Promise.all([
    prisma.post.findMany({
      where,
      include: publicPostInclude,
      orderBy: [{ publishedAt: 'desc' }],
      skip: (page - 1) * perPage,
      take: perPage
    }),
    prisma.post.count({ where }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      include: publicPostInclude,
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      take: 10
    })
  ]).catch(() => [[], 0, []]);

  /* Category slug → CSS class */
  const cssSlug = category.slug;

  return (
    <>
      {/* Colored category hero */}
      <div className={`cat-hero category-${cssSlug}`}>
        <div className="container">
          <span className="cf-badge">{category.name}</span>
          <h1>{category.name}</h1>
          {category.description && <p>{category.description}</p>}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 8 }}>
        <Breadcrumbs items={[{ label: category.name }]} />
        <BannerAd slot="CATEGORY_TOP" />

        <div className="news-layout" style={{ marginTop: 16 }}>
          <div>
            {posts.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <p className="muted">No hay noticias publicadas en esta categoría todavía.</p>
              </div>
            ) : (
              <>
                {/* First post: large horizontal card */}
                {posts[0] && (
                  <div style={{ marginBottom: 20 }}>
                    <PostCard post={posts[0]} variant="horizontal" priority />
                  </div>
                )}

                {/* Rest: grid */}
                {posts.length > 1 && (
                  <div className="editorial-grid">
                    {posts.slice(1).map((post) => (
                      <PostCard post={post} key={post.id} />
                    ))}
                  </div>
                )}
              </>
            )}
            <Pagination page={page} perPage={perPage} total={total} basePath={`/categoria/${category.slug}`} />
          </div>

          <aside className="sidebar" aria-label="Más leídas">
            <MostRead posts={mostRead} />
            <BannerAd slot="SIDEBAR" />
          </aside>
        </div>
      </div>
    </>
  );
}
