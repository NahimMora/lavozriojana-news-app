import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import { escapeXml } from '@/lib/xml';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      publishedAt: { gte: cutoff, lte: now }
    },
    select: { title: true, slug: true, publishedAt: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
    take: 1000
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${posts
  .map(
    (post) => `<url>
  <loc>${escapeXml(absoluteUrl(`/noticias/${post.slug}`))}</loc>
  <news:news>
    <news:publication>
      <news:name>${escapeXml(SITE_NAME)}</news:name>
      <news:language>es</news:language>
    </news:publication>
    <news:publication_date>${(post.publishedAt || post.updatedAt).toISOString()}</news:publication_date>
    <news:title>${escapeXml(post.title)}</news:title>
  </news:news>
  <lastmod>${post.updatedAt.toISOString()}</lastmod>
</url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}
