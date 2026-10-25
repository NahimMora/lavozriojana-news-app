import type { MetadataRoute } from 'next';
import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* lastmod only where it reflects a real content change: Google stops trusting
   it (for the stories too) if every request reports "now". */
const STATIC_PATHS = [
  '/servicios',
  '/videos',
  '/contacto',
  '/publicidad',
  '/quienes-somos',
  '/equipo',
  '/politica-editorial',
  '/politica-de-correcciones',
  '/politica-de-uso-de-ia',
  '/politica-de-privacidad',
  '/terminos-y-condiciones'
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = { url: absoluteUrl('/'), changeFrequency: 'hourly' as const, priority: 1 };
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: 'monthly' as const,
    priority: 0.5
  }));

  try {
    const publishedWhere = { status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } };
    const [posts, categories, authors, latestByCategory, latestByAuthor] = await Promise.all([
      prisma.post.findMany({
        where: publishedWhere,
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 5000
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true }
      }),
      prisma.author.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true }
      }),
      prisma.post.groupBy({ by: ['categoryId'], where: publishedWhere, _max: { publishedAt: true } }),
      prisma.post.groupBy({ by: ['authorId'], where: publishedWhere, _max: { publishedAt: true } })
    ]);

    // A section or author page changes when a story is published in it.
    const categoryLatest = new Map(latestByCategory.map((row) => [row.categoryId, row._max.publishedAt]));
    const authorLatest = new Map(latestByAuthor.map((row) => [row.authorId, row._max.publishedAt]));
    const newest = (...dates: (Date | null | undefined)[]) =>
      dates.reduce<Date | undefined>((max, date) => (date && (!max || date > max) ? date : max), undefined);

    return [
      { ...home, lastModified: posts[0]?.updatedAt },
      ...staticRoutes,
      ...categories.map((category) => ({
        url: absoluteUrl(`/categoria/${category.slug}`),
        lastModified: newest(category.updatedAt, categoryLatest.get(category.id)),
        changeFrequency: 'daily' as const,
        priority: 0.7
      })),
      ...authors.map((author) => ({
        url: absoluteUrl(`/autores/${author.slug}`),
        lastModified: newest(author.updatedAt, authorLatest.get(author.id)),
        changeFrequency: 'weekly' as const,
        priority: 0.4
      })),
      ...posts.map((post) => ({
        url: absoluteUrl(`/noticias/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8
      }))
    ];
  } catch {
    return [home, ...staticRoutes];
  }
}
