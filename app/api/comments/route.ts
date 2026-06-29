import { NextResponse } from 'next/server';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { jsonError, jsonOk } from '@/lib/http';
import { publicCommentSchema } from '@/lib/schemas';
import { sanitizeCommentBody, sanitizePlainText } from '@/lib/sanitize';
import { getRequestIp, hashValue } from '@/lib/request';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) return jsonError('Base de datos no configurada.', 503);

    const body = await request.json();
    const input = publicCommentSchema.parse(body);

    if (input.website) {
      return jsonOk({ status: 'ignored' });
    }

    const cleanBody = sanitizeCommentBody(input.body);
    if (!cleanBody) return jsonError('El comentario no puede estar vacío ni contener links.', 400);

    const post = await prisma.post.findFirst({
      where: {
        id: input.postId,
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() }
      },
      select: { id: true }
    });
    if (!post) return jsonError('Noticia inexistente.', 404);

    const comment = await prisma.comment.create({
      data: {
        postId: input.postId,
        authorName: sanitizePlainText(input.authorName, 120),
        body: cleanBody,
        ipHash: hashValue(getRequestIp(request.headers))
      }
    });

    return jsonOk({ id: comment.id, status: 'pending' }, { status: 201 });
  } catch (error) {
    return jsonError('Comentario inválido.', 400, error instanceof Error ? error.message : error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
