import { ContactMessageStatus } from '@prisma/client';
import { requireApiKey } from '@/lib/auth';
import { getPagination, jsonOk } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get('status')?.toUpperCase() as ContactMessageStatus | undefined;
  const where = status && Object.values(ContactMessageStatus).includes(status) ? { status } : {};

  const { page, perPage, skip } = getPagination(request.url, { page: 1, perPage: 50 });
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: perPage }),
    prisma.contactMessage.count({ where })
  ]);

  return jsonOk({ items, pagination: { page, perPage, total } });
}
