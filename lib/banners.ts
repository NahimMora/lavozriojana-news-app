import { BannerSlot } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getActiveBanners(slot: BannerSlot, limit = 1, trackImpressions = true) {
  if (!process.env.DATABASE_URL) return [];

  const now = new Date();
  const banners = await prisma.banner
    .findMany({
      where: {
        slot,
        isActive: true,
        imageUrl: { not: null },
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
        ]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit
    })
    .catch(() => []);

  if (trackImpressions && banners.length > 0) {
    await prisma.banner.updateMany({
      where: { id: { in: banners.map((banner) => banner.id) } },
      data: { impressionCount: { increment: 1 } }
    });
  }

  return banners;
}

export async function getActiveBanner(slot: BannerSlot) {
  const [banner] = await getActiveBanners(slot, 1);
  return banner || null;
}
