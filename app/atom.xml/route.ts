import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { absoluteUrl, SITE_NAME, SITE_SLOGAN, SITE_URL } from '@/lib/site';
import { escapeXml } from '@/lib/xml';

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
      author: { select: { name: true } }
    },
    orderBy: { publishedAt: 'desc' },
    take: 50
  });

  const updated = posts[0]?.updatedAt?.toISOString() || new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${escapeXml(SITE_URL)}</id>
  <title>${escapeXml(SITE_NAME)}</title>
  <subtitle>${escapeXml(SITE_SLOGAN)}</subtitle>
  <link href="${escapeXml(SITE_URL)}"/>
  <link href="${escapeXml(absoluteUrl('/atom.xml'))}" rel="self"/>
  <updated>${updated}</updated>
${posts
  .map((post) => {
    const url = absoluteUrl(`/noticias/${post.slug}`);
    return `  <entry>
    <id>${escapeXml(url)}</id>
    <title>${escapeXml(post.title)}</title>
    <link href="${escapeXml(url)}"/>
    <updated>${post.updatedAt.toISOString()}</updated>
    <published>${(post.publishedAt || post.updatedAt).toISOString()}</published>
    <author><name>${escapeXml(post.author.name)}</name></author>
    <summary>${escapeXml(post.excerpt)}</summary>
  </entry>`;
  })
  .join('\n')}
</feed>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' }
  });
}
