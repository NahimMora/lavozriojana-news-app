import { requireApiKey } from '@/lib/auth';
import { jsonError, jsonOk, parseNumericId } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { bannerPatchSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;
  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);

  try {
    const input = bannerPatchSchema.parse(await request.json());
    const banner = await prisma.banner.update({ where: { id }, data: input });
    return jsonOk(banner);
  } catch (error) {
    return jsonError('No se pudo actualizar el banner.', 400, error instanceof Error ? error.message : error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;
  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);
  await prisma.banner.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
