import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BannerAd } from '@/components/news/BannerAd';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { MostRead } from '@/components/news/MostRead';
import { Pagination } from '@/components/news/Pagination';
import { PostCard } from '@/components/news/PostCard';
import { SectionTrends } from '@/components/feed/SectionTrends';
import { ServiceCards } from '@/components/services/ServiceCards';
import { getSectionTrending } from '@/lib/feed';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/site';
import { prisma } from '@/lib/prisma';
import { publicPostInclude, type PublicPost } from '@/lib/posts';
import { notFoundMetadata, pageMetadata, parsePageParam } from '@/lib/seo';

export const runtime = 'nodejs';
export const revalidate = 120;

type Props = {
  params: { slug: string };
  searchParams: { page?: string };
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!category || !category.isActive) return notFoundMetadata('Categoría no encontrada');
  const page = parsePageParam(searchParams.page);
  const path = page > 1 ? `/categoria/${category.slug}?page=${page}` : `/categoria/${category.slug}`;

  const title = page > 1 ? `${category.name} - página ${page}` : `${category.name}: noticias de La Rioja`;
  const description = category.description || `Últimas noticias de ${category.name} en La Rioja, Argentina.`;

  return pageMetadata({ path, title, description });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const page = parsePageParam(searchParams.page);
  const perPage = 13; /* 1 nota destacada + 12 en grilla de 3 columnas (4 filas completas) */

  const category = await prisma.category
    .findUnique({ where: { slug: params.slug } })
    .catch(() => null);
  if (!category || !category.isActive) notFound();

  const where = {
    status: 'PUBLISHED' as const,
    publishedAt: { lte: new Date() },
    categoryId: category.id
  };

  // The section's Instagram ranking is read in parallel with the stories.
  const trendingPromise = getSectionTrending(category.slug).catch(() => []);
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
  ]).catch(() => [[], -1, []] as [PublicPost[], number, PublicPost[]]);
  // Pages past the last one are empty: 404 so they never get indexed
  // (total -1 means the query failed; that is not a reason to 404).
  if (page > 1 && total >= 0 && page > Math.ceil(total / perPage)) notFound();
  const sectionTrends = await trendingPromise;

  /* Category slug → CSS class */
  const cssSlug = category.slug;
  const categoryUrl = absoluteUrl(`/categoria/${category.slug}`);
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: SITE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: categoryUrl
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Compact section header: identity without pushing the news down */}
      <div className={`cat-hero category-${cssSlug}`}>
        <div className="container cat-hero-inner">
          <Breadcrumbs items={[{ label: category.name }]} />
          <div className="cat-hero-row">
            <h1>{category.name}</h1>
            {category.description && <p>{category.description}</p>}
          </div>
        </div>
      </div>

      {/* Grid areas place the square CATEGORY_TOP ad at the top of the right
          column on desktop and right after the lead story on phones. */}
      <div className="container category-body">
        <div className="news-layout category-layout">
          {posts.length === 0 ? (
            <div className="category-lead category-empty">
              <p className="muted">No hay noticias publicadas en esta categoría todavía.</p>
            </div>
          ) : (
            <div className="category-lead">
              <PostCard post={posts[0]} variant="lead" priority imageSizes="(min-width: 1280px) 500px, (min-width: 768px) 50vw, 100vw" />
            </div>
          )}

          <BannerAd slot="CATEGORY_TOP" className="category-top-ad" />

          <div className="category-list">
            {posts.length > 1 && (
              <div className="editorial-grid">
                {posts.slice(1).map((post) => (
                  <PostCard post={post} key={post.id} />
                ))}
              </div>
            )}
            <Pagination page={page} perPage={perPage} total={Math.max(0, total)} basePath={`/categoria/${category.slug}`} />
          </div>

          <aside className="sidebar" aria-label="Lateral de la sección">
            {/* With the Instagram ranking beside it, "Más leídas" keeps six
                stories so the rail stays as tall as the grid. */}
            <MostRead posts={sectionTrends.length ? mostRead.slice(0, 6) : mostRead} />
            <SectionTrends stories={sectionTrends} sectionName={category.name} />
            <ServiceCards kinds={['dolar', 'clima', 'feriado']} limit={2} />
            <BannerAd slot="SIDEBAR" />
          </aside>
        </div>
      </div>
    </>
  );
}
