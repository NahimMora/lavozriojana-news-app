import { requireApiKey } from '@/lib/auth';
import { jsonError, jsonOk, parseNumericId } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { authorPatchSchema } from '@/lib/schemas';
import { ensureUniqueAuthorSlug } from '@/lib/slug';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;
  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);

  try {
    const input = authorPatchSchema.parse(await request.json());
    const author = await prisma.author.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.slug || input.name ? { slug: await ensureUniqueAuthorSlug(input.slug || input.name || '', id) } : {}),
        ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      }
    });
    return jsonOk(author);
  } catch (error) {
    return jsonError('No se pudo actualizar el autor.', 400, error instanceof Error ? error.message : error);
  }
}
