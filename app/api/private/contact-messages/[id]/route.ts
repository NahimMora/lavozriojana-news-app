import { requireApiKey } from '@/lib/auth';
import { jsonError, jsonOk, parseNumericId } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { contactMessagePatchSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;
  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);

  try {
    const input = contactMessagePatchSchema.parse(await request.json());
    const message = await prisma.contactMessage.update({
      where: { id },
      data: { status: input.status }
    });
    return jsonOk(message);
  } catch (error) {
    return jsonError('No se pudo actualizar el mensaje.', 400, error instanceof Error ? error.message : error);
  }
}
