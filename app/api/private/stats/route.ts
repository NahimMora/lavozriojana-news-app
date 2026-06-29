import { PostStatus } from '@prisma/client';
import { requireApiKey } from '@/lib/auth';
import { jsonOk } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const [posts, publishedPosts, views, pendingComments, activeBanners, phoneLeads] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.banner.count({ where: { isActive: true } }),
    prisma.phoneLead.count({ where: { status: 'ACTIVE' } })
  ]);

  return jsonOk({
    posts,
    publishedPosts,
    totalViews: views._sum.viewCount || 0,
    pendingComments,
    activeBanners,
    phoneLeads
  });
}
