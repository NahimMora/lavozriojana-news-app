import { NextResponse } from 'next/server';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { jsonError, jsonOk } from '@/lib/http';
import { phoneLeadSchema } from '@/lib/schemas';
import { sanitizePlainText } from '@/lib/sanitize';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) return jsonError('Base de datos no configurada.', 503);

    const body = await request.json();
    const input = phoneLeadSchema.parse(body);

    if (input.website) {
      return jsonOk({ status: 'ignored' });
    }

    const lead = await prisma.phoneLead.create({
      data: {
        name: input.name ? sanitizePlainText(input.name, 120) : null,
        phone: input.phone,
        consent: input.consent,
        source: input.source ? sanitizePlainText(input.source, 240) : null
      }
    });

    return jsonOk({ id: lead.id, status: 'active' }, { status: 201 });
  } catch (error) {
    return jsonError('Datos inválidos.', 400, error instanceof Error ? error.message : error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
