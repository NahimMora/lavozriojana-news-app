import { prisma } from '@/lib/prisma';
import { getRequestIp, hashValue, isLikelyBot } from '@/lib/request';

const VIEW_WINDOW_MS = 60_000;

export async function recordPostView(postId: number, headers: Headers) {
  const userAgent = headers.get('user-agent') || '';
  if (!userAgent || isLikelyBot(userAgent)) return false;

  const ipHash = hashValue(getRequestIp(headers));
  const userAgentHash = hashValue(userAgent);
  const recentThreshold = new Date(Date.now() - VIEW_WINDOW_MS);

  const recentView = await prisma.pageView.findFirst({
    where: {
      postId,
      ipHash,
      createdAt: { gte: recentThreshold }
    },
    select: { id: true }
  });

  if (recentView) return false;

  await prisma.$transaction([
    prisma.pageView.create({
      data: {
        postId,
        ipHash,
        userAgentHash
      }
    }),
    prisma.$executeRaw`UPDATE posts SET viewCount = viewCount + 1 WHERE id = ${postId}`
  ]);

  return true;
}
