import { PostStatus } from '@prisma/client';
import { requireApiKey } from '@/lib/auth';
import { getPagination, jsonError, jsonOk } from '@/lib/http';
import { createPost } from '@/lib/post-mutations';
import { publicPostInclude } from '@/lib/posts';
import { prisma } from '@/lib/prisma';
import { postCreateSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const { page, perPage, skip } = getPagination(request.url);
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get('status')?.toUpperCase() as PostStatus | undefined;

  const where = status && Object.values(PostStatus).includes(status) ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: publicPostInclude,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: perPage
    }),
    prisma.post.count({ where })
  ]);

  return jsonOk({ items, pagination: { page, perPage, total } });
}

export async function POST(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  try {
    const input = postCreateSchema.parse(await request.json());
    const post = await createPost(input);
    return jsonOk(post, { status: 201 });
  } catch (error) {
    return jsonError('No se pudo crear la noticia.', 400, error instanceof Error ? error.message : error);
  }
}
