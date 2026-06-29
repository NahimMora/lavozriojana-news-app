import { requireApiKey } from '@/lib/auth';
import { jsonError, jsonOk, parseNumericId } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { categoryPatchSchema } from '@/lib/schemas';
import { ensureUniqueCategorySlug } from '@/lib/slug';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;
  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);

  try {
    const input = categoryPatchSchema.parse(await request.json());
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.slug || input.name ? { slug: await ensureUniqueCategorySlug(input.slug || input.name || '', id) } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.color !== undefined ? { color: input.color || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      }
    });
    return jsonOk(category);
  } catch (error) {
    return jsonError('No se pudo actualizar la categoría.', 400, error instanceof Error ? error.message : error);
  }
}
