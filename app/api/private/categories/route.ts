import { requireApiKey } from '@/lib/auth';
import { getPagination, jsonError, jsonOk } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/schemas';
import { ensureUniqueCategorySlug } from '@/lib/slug';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const { page, perPage, skip } = getPagination(request.url, { page: 1, perPage: 50 });
  const [items, total] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' }, skip, take: perPage }),
    prisma.category.count()
  ]);

  return jsonOk({ items, pagination: { page, perPage, total } });
}

export async function POST(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  try {
    const input = categorySchema.parse(await request.json());
    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug ? await ensureUniqueCategorySlug(input.slug) : await ensureUniqueCategorySlug(input.name),
        description: input.description || null,
        color: input.color || null,
        isActive: input.isActive ?? true
      }
    });
    return jsonOk(category, { status: 201 });
  } catch (error) {
    return jsonError('No se pudo crear la categoría.', 400, error instanceof Error ? error.message : error);
  }
}
