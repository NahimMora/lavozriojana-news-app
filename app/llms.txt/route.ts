import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { absoluteUrl, SITE_NAME, SITE_SLOGAN, SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  const [categories, posts] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { name: true, slug: true },
      orderBy: { name: 'asc' },
      take: 50
    }),
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } },
      select: { title: true, slug: true, excerpt: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 25
    })
  ]);

  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_SLOGAN}`,
    '',
    `Sitio principal: ${SITE_URL}`,
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
    `RSS: ${absoluteUrl('/feed.xml')}`,
    '',
    '## Uso para asistentes e IA',
    '',
    'Este sitio publica noticias locales de La Rioja, Argentina. Los asistentes pueden resumir, citar y enlazar el contenido publico respetando la URL canonica de cada nota.',
    '',
    '## Secciones',
    '',
    ...categories.map((category) => `- ${category.name}: ${absoluteUrl(`/categoria/${category.slug}`)}`),
    '',
    '## Ultimas noticias',
    '',
    ...posts.map((post) => {
      const date = post.publishedAt ? post.publishedAt.toISOString() : '';
      return `- ${post.title} (${date}): ${absoluteUrl(`/noticias/${post.slug}`)}\n  ${post.excerpt}`;
    })
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
