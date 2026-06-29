import { PostStatus } from '@prisma/client';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { getPagination, jsonOk } from '@/lib/http';
import { publicPostInclude } from '@/lib/posts';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { page, perPage, skip } = getPagination(request.url);
  if (!isDatabaseConfigured()) return jsonOk({ items: [], pagination: { page, perPage, total: 0 } });

  const searchParams = new URL(request.url).searchParams;
  const category = searchParams.get('category');

  const where = {
    status: PostStatus.PUBLISHED,
    publishedAt: { lte: new Date() },
    ...(category ? { category: { slug: category } } : {})
  };

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: publicPostInclude,
      orderBy: [{ publishedAt: 'desc' }],
      skip,
      take: perPage
    }),
    prisma.post.count({ where })
  ]).catch(() => [[], 0]);

  return jsonOk({ items, pagination: { page, perPage, total } });
}
