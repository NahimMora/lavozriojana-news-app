import { jsonError, jsonOk } from '@/lib/http';
import { getPostBySlug } from '@/lib/posts';

export const runtime = 'nodejs';

type Context = { params: { slug: string } };

export async function GET(_request: Request, { params }: Context) {
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) return jsonError('Noticia inexistente.', 404);
  return jsonOk(post);
}
