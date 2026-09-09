import { NextResponse } from 'next/server';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { jsonError, jsonOk } from '@/lib/http';
import { contactMessageSchema } from '@/lib/schemas';
import { sanitizePlainText } from '@/lib/sanitize';
import { getRequestIp, hashValue } from '@/lib/request';

export const runtime = 'nodejs';

const RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) return jsonError('Base de datos no configurada.', 503);

    const body = await request.json();
    const input = contactMessageSchema.parse(body);

    // Honeypot: los bots completan este campo oculto, las personas no.
    if (input.website) {
      return jsonOk({ status: 'ignored' });
    }

    const ipHash = hashValue(getRequestIp(request.headers));

    const recent = await prisma.contactMessage.findFirst({
      where: { ipHash, createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) } },
      select: { id: true }
    });
    if (recent) return jsonError('Ya recibimos tu mensaje. Esperá un momento antes de reenviar.', 429);

    const message = await prisma.contactMessage.create({
      data: {
        name: sanitizePlainText(input.name, 160),
        email: sanitizePlainText(input.email, 200),
        subject: input.subject ? sanitizePlainText(input.subject, 200) : null,
        message: sanitizePlainText(input.message, 4000),
        ipHash
      }
    });

    return jsonOk({ id: message.id, status: 'received' }, { status: 201 });
  } catch (error) {
    return jsonError('No se pudo enviar el mensaje. Revisá los datos e intentá nuevamente.', 400, error instanceof Error ? error.message : error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
