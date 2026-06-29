import { PostStatus } from '@prisma/client';
import { requireApiKey } from '@/lib/auth';
import { getPagination, jsonError, jsonOk } from '@/lib/http';
import { publicPostInclude } from '@/lib/posts';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const searchParams = new URL(request.url).searchParams;
  const postId = Number(searchParams.get('id') || 0);

  if (postId) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [post, recentViews, totalEvents] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId }, include: publicPostInclude }),
      prisma.pageView.count({ where: { postId, createdAt: { gte: since } } }),
      prisma.pageView.count({ where: { postId } })
    ]);
    if (!post) return jsonError('Noticia inexistente.', 404);
    return jsonOk({ post, recentViews, totalEvents });
  }

  const { page, perPage, skip } = getPagination(request.url, { page: 1, perPage: 20 });
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      include: publicPostInclude,
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      skip,
      take: perPage
    }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } })
  ]);

  return jsonOk({ items, pagination: { page, perPage, total } });
}
