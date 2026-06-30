import { NextResponse } from 'next/server';
import { PostStatus } from '@prisma/client';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { publicPostInclude } from '@/lib/posts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const currentSlug = (searchParams.get('slug') || '').trim();
  const excludeParam = (searchParams.get('exclude') || '').trim();
  const excludeSlugs = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

  const allExcluded = [...new Set([currentSlug, ...excludeSlugs].filter(Boolean))];
  const now = new Date();

  try {
    /* Get publishedAt of current post to find what comes after */
    let afterDate: Date | null = null;
    if (currentSlug) {
      const current = await prisma.post.findFirst({
        where: { slug: currentSlug, status: PostStatus.PUBLISHED },
        select: { publishedAt: true }
      });
      afterDate = current?.publishedAt ?? null;
    }

    const post = await prisma.post.findFirst({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: afterDate ? { lt: afterDate } : { lte: now },
        ...(allExcluded.length > 0 ? { slug: { notIn: allExcluded } } : {})
      },
      include: { ...publicPostInclude },
      orderBy: [{ publishedAt: 'desc' }]
    });

    if (!post) {
      return new NextResponse(null, { status: 204 });
    }

    /* Related posts from same category */
    const relatedPosts = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { lte: now },
        categoryId: post.categoryId,
        slug: { notIn: [...allExcluded, post.slug] }
      },
      select: {
        slug: true,
        title: true,
        mainImageUrl: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } }
      },
      orderBy: [{ publishedAt: 'desc' }],
      take: 7
    });

    return NextResponse.json({
      ...post,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      updatedAt:   post.updatedAt.toISOString(),
      createdAt:   post.createdAt?.toISOString() ?? null,
      relatedPosts: relatedPosts.map((p) => ({
        slug:         p.slug,
        title:        p.title,
        mainImageUrl: p.mainImageUrl,
        publishedAt:  p.publishedAt?.toISOString() ?? null,
        category:     p.category
      }))
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
