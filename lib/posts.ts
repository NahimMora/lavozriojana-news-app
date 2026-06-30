import { Prisma, PostStatus } from '@prisma/client';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { INITIAL_CATEGORIES } from '@/lib/site';

export const publicPostInclude = {
  category: true,
  author: true,
  tags: {
    include: {
      tag: true
    }
  }
} satisfies Prisma.PostInclude;

export type PublicPost = Prisma.PostGetPayload<{
  include: typeof publicPostInclude;
}>;

const categoryOrder = new Map(INITIAL_CATEGORIES.map((name, index) => [name.toLowerCase(), index]));

export function sortCategories<T extends { name: string }>(categories: T[]) {
  return categories.sort((a, b) => {
    const aOrder = categoryOrder.get(a.name.toLowerCase()) ?? 999;
    const bOrder = categoryOrder.get(b.name.toLowerCase()) ?? 999;
    return aOrder - bOrder || a.name.localeCompare(b.name, 'es-AR');
  });
}

export const publicPostWhere = {
  status: PostStatus.PUBLISHED,
  publishedAt: {
    lte: new Date()
  }
} satisfies Prisma.PostWhereInput;

export async function getCategoriesSafe() {
  if (!isDatabaseConfigured()) return [];

  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return sortCategories(categories);
  } catch {
    return [];
  }
}

const emptyHomeData = {
  categories: [],
  breaking: [],
  featured: [],
  latest: [],
  mostRead: [],
  categoryBlocks: []
};

export async function getHomeData() {
  if (!isDatabaseConfigured()) return emptyHomeData;

  const now = new Date();
  const where = {
    status: PostStatus.PUBLISHED,
    publishedAt: { lte: now }
  } satisfies Prisma.PostWhereInput;

  try {
    const [categories, breaking, featured, latest, mostRead] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.post.findMany({
        where: { ...where, isBreaking: true },
        include: publicPostInclude,
        orderBy: [{ editorialPriority: 'desc' }, { publishedAt: 'desc' }],
        take: 6
      }),
      prisma.post.findMany({
        where: { ...where, isFeatured: true },
        include: publicPostInclude,
        orderBy: [{ editorialPriority: 'desc' }, { publishedAt: 'desc' }],
        take: 5
      }),
      prisma.post.findMany({
        where,
        include: publicPostInclude,
        orderBy: [{ publishedAt: 'desc' }],
        take: 18
      }),
      prisma.post.findMany({
        where,
        include: publicPostInclude,
        orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
        take: 6
      })
    ]);

    const sortedCategories = sortCategories(categories);

    const categoryBlocks = await Promise.all(
      sortedCategories.slice(0, 6).map(async (category) => ({
        category,
        posts: await prisma.post.findMany({
          where: {
            ...where,
            categoryId: category.id
          },
          include: publicPostInclude,
          orderBy: [{ publishedAt: 'desc' }],
          take: 4
        })
      }))
    );

    return {
      categories: sortedCategories,
      breaking,
      featured,
      latest,
      mostRead,
      categoryBlocks
    };
  } catch {
    return emptyHomeData;
  }
}

export async function getPostBySlug(slug: string) {
  if (!isDatabaseConfigured()) return null;

  return prisma.post.findFirst({
    where: {
      slug,
      status: PostStatus.PUBLISHED,
      publishedAt: { lte: new Date() }
    },
    include: {
      ...publicPostInclude,
      comments: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

export async function getRelatedPosts(post: PublicPost, limit = 4) {
  if (!isDatabaseConfigured()) return [];

  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
      id: { not: post.id },
      OR: [
        { categoryId: post.categoryId },
        {
          tags: {
            some: {
              tagId: {
                in: post.tags.map((item) => item.tagId)
              }
            }
          }
        }
      ]
    },
    include: publicPostInclude,
    orderBy: [{ publishedAt: 'desc' }],
    take: limit
  });
}

export async function searchPosts(query: string, page: number, perPage: number) {
  if (!isDatabaseConfigured()) return { posts: [], total: 0 };

  const q = query.trim();
  const skip = (page - 1) * perPage;
  const where: Prisma.PostWhereInput = {
    status: PostStatus.PUBLISHED,
    publishedAt: { lte: new Date() },
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
            { contentText: { contains: q } },
            { category: { name: { contains: q } } },
            { author: { name: { contains: q } } },
            { tags: { some: { tag: { name: { contains: q } } } } }
          ]
        }
      : {})
  };

  const [posts, total]: [PublicPost[], number] = await Promise.all([
    prisma.post.findMany({
      where,
      include: publicPostInclude,
      orderBy: [{ publishedAt: 'desc' }],
      skip,
      take: perPage
    }),
    prisma.post.count({ where })
  ]).catch(() => [[], 0]);

  return { posts, total };
}
