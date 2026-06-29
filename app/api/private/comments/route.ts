import { CommentStatus } from '@prisma/client';
import { requireApiKey } from '@/lib/auth';
import { getPagination, jsonOk } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const { page, perPage, skip } = getPagination(request.url, { page: 1, perPage: 30 });
  const status = new URL(request.url).searchParams.get('status')?.toUpperCase() as CommentStatus | undefined;
  const where = status && Object.values(CommentStatus).includes(status) ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: { post: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage
    }),
    prisma.comment.count({ where })
  ]);

  return jsonOk({ items, pagination: { page, perPage, total } });
}
