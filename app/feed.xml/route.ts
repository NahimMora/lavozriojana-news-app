import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { absoluteUrl, SITE_NAME, SITE_SLOGAN, SITE_URL } from '@/lib/site';
import { escapeXml, formatRssDate } from '@/lib/xml';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } }
    },
    orderBy: { publishedAt: 'desc' },
    take: 50
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_SLOGAN)}</description>
    <language>es-AR</language>
    <lastBuildDate>${formatRssDate(posts[0]?.updatedAt)}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl('/feed.xml'))}" rel="self" type="application/rss+xml"/>
${posts
  .map((post) => {
    const url = absoluteUrl(`/noticias/${post.slug}`);
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${formatRssDate(post.publishedAt)}</pubDate>
      <category>${escapeXml(post.category.name)}</category>
      <dc:creator>${escapeXml(post.author.name)}</dc:creator>
    </item>`;
  })
  .join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  });
}
