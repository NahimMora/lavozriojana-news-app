import { requireApiKey } from '@/lib/auth';
import { jsonError, jsonOk, parseNumericId } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { phoneLeadPatchSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;
  const id = parseNumericId(params.id);
  if (!id) return jsonError('ID inválido.', 400);

  try {
    const input = phoneLeadPatchSchema.parse(await request.json());
    const lead = await prisma.phoneLead.update({
      where: { id },
      data: { status: input.status }
    });
    return jsonOk(lead);
  } catch (error) {
    return jsonError('No se pudo actualizar el lead.', 400, error instanceof Error ? error.message : error);
  }
}
