import type { MetadataRoute } from 'next';
import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/contacto',
    '/publicidad',
    '/quienes-somos',
    '/politica-de-privacidad',
    '/terminos-y-condiciones'
  ].map((path) => ({
    url: absoluteUrl(path || '/'),
    lastModified: new Date(),
    changeFrequency: path === '' ? ('hourly' as const) : ('monthly' as const),
    priority: path === '' ? 1 : 0.5
  }));

  try {
    const [posts, categories] = await Promise.all([
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 5000
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true }
      })
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: absoluteUrl(`/categoria/${category.slug}`),
        lastModified: category.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.7
      })),
      ...posts.map((post) => ({
        url: absoluteUrl(`/noticias/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8
      }))
    ];
  } catch {
    return staticRoutes;
  }
}
