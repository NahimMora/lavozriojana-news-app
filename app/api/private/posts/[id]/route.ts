import { PostStatus } from '@prisma/client';
import { requireApiKey } from '@/lib/auth';
import { jsonError, jsonOk, parseNumericId } from '@/lib/http';
import { updatePost } from '@/lib/post-mutations';
import { publicPostInclude } from '@/lib/posts';
import { prisma } from '@/lib/prisma';
import { postPatchSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function GET(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);

  const post = await prisma.post.findUnique({
    where: { id },
    include: publicPostInclude
  });

  if (!post) return jsonError('Noticia inexistente.', 404);
  return jsonOk(post);
}

export async function PATCH(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);

  try {
    const input = postPatchSchema.parse(await request.json());
    const post = await updatePost(id, input);
    return jsonOk(post);
  } catch (error) {
    return jsonError('No se pudo actualizar la noticia.', 400, error instanceof Error ? error.message : error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);

  const hard = new URL(request.url).searchParams.get('hard') === 'true';
  if (hard) {
    await prisma.post.delete({ where: { id } });
    return jsonOk({ deleted: true });
  }

  const post = await prisma.post.update({
    where: { id },
    data: { status: PostStatus.ARCHIVED }
  });

  return jsonOk({ archived: true, id: post.id });
}
