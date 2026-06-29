import { BannerSlot } from '@prisma/client';
import { requireApiKey } from '@/lib/auth';
import { getPagination, jsonError, jsonOk } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { bannerSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const { page, perPage, skip } = getPagination(request.url, { page: 1, perPage: 50 });
  const slot = new URL(request.url).searchParams.get('slot') as BannerSlot | null;
  const where = slot && Object.values(BannerSlot).includes(slot) ? { slot } : {};
  const [items, total] = await Promise.all([
    prisma.banner.findMany({ where, orderBy: [{ slot: 'asc' }, { priority: 'desc' }], skip, take: perPage }),
    prisma.banner.count({ where })
  ]);

  return jsonOk({ items, pagination: { page, perPage, total } });
}

export async function POST(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  try {
    const input = bannerSchema.parse(await request.json());
    const banner = await prisma.banner.create({ data: input });
    return jsonOk(banner, { status: 201 });
  } catch (error) {
    return jsonError('No se pudo crear el banner.', 400, error instanceof Error ? error.message : error);
  }
}
