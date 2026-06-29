import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureUniqueCategorySlug, ensureUniquePostSlug, slugify } from '@/lib/slug';
import { plainTextFromHtml, sanitizeArticleHtml } from '@/lib/sanitize';
import type { z } from 'zod';
import type { postCreateSchema, postPatchSchema } from '@/lib/schemas';
import { publicPostInclude } from '@/lib/posts';

type PostCreateInput = z.infer<typeof postCreateSchema>;
type PostPatchInput = z.infer<typeof postPatchSchema>;
type ImageInput = Partial<
  Pick<
    PostCreateInput,
    | 'mainImage'
    | 'mainImageUrl'
    | 'mainImageWidth'
    | 'mainImageHeight'
    | 'mainImageAlt'
    | 'mainImageCaption'
    | 'mainImageCredit'
  >
>;

async function resolveCategory(input: Pick<PostCreateInput, 'categoryId' | 'categorySlug' | 'categoryName'>) {
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new Error('Categoría inexistente.');
    return category;
  }

  const categorySlug = input.categorySlug
    ? slugify(input.categorySlug, 'categoria')
    : input.categoryName
      ? slugify(input.categoryName, 'categoria')
      : null;
  if (!categorySlug) throw new Error('La categoría es obligatoria.');

  const existing = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (existing) return existing;

  if (!input.categoryName) throw new Error('Categoría inexistente.');

  return prisma.category.create({
    data: {
      name: input.categoryName,
      slug: await ensureUniqueCategorySlug(input.categoryName),
      description: `Noticias de ${input.categoryName}.`
    }
  });
}

async function resolveAuthor(input: Pick<PostCreateInput, 'authorId' | 'authorSlug' | 'authorName'>) {
  if (input.authorId) {
    const author = await prisma.author.findUnique({ where: { id: input.authorId } });
    if (!author) throw new Error('Autor inexistente.');
    return author;
  }

  if (input.authorSlug) {
    const author = await prisma.author.findUnique({ where: { slug: slugify(input.authorSlug, 'autor') } });
    if (author) return author;
  }

  if (input.authorName) {
    return prisma.author.upsert({
      where: { slug: slugify(input.authorName, 'autor') },
      update: { name: input.authorName, isActive: true },
      create: {
        name: input.authorName,
        slug: slugify(input.authorName, 'autor')
      }
    });
  }

  return prisma.author.upsert({
    where: { slug: 'redaccion-la-voz-riojana' },
    update: { name: 'Redacción La Voz Riojana', isActive: true },
    create: {
      name: 'Redacción La Voz Riojana',
      slug: 'redaccion-la-voz-riojana'
    }
  });
}

async function replacePostTags(postId: number, tags?: string[]) {
  if (!tags) return;

  const normalizedTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);

  await prisma.postTag.deleteMany({ where: { postId } });

  for (const tagName of normalizedTags) {
    const tag = await prisma.tag.upsert({
      where: { slug: slugify(tagName, 'tag') },
      update: { name: tagName },
      create: {
        name: tagName,
        slug: slugify(tagName, 'tag')
      }
    });

    await prisma.postTag.create({
      data: {
        postId,
        tagId: tag.id
      }
    });
  }
}

function imageFields(input: ImageInput) {
  const image = input.mainImage;
  return {
    mainImageUrl: image?.url ?? input.mainImageUrl ?? null,
    mainImageWidth: image?.width ?? input.mainImageWidth ?? null,
    mainImageHeight: image?.height ?? input.mainImageHeight ?? null,
    mainImageAlt: image?.alt ?? input.mainImageAlt ?? null,
    mainImageCaption: image?.caption ?? input.mainImageCaption ?? null,
    mainImageCredit: image?.credit ?? input.mainImageCredit ?? null
  };
}

export async function createPost(input: PostCreateInput) {
  const category = await resolveCategory(input);
  const author = await resolveAuthor(input);
  const contentHtml = sanitizeArticleHtml(input.contentHtml);
  const slug = await ensureUniquePostSlug(input.slug || input.title);
  const publishedAt = input.status === PostStatus.PUBLISHED ? input.publishedAt || new Date() : input.publishedAt || null;

  const post = await prisma.post.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      contentHtml,
      contentText: plainTextFromHtml(contentHtml),
      categoryId: category.id,
      authorId: author.id,
      sourceName: input.sourceName || null,
      sourceUrl: input.sourceUrl || null,
      ...imageFields(input),
      status: input.status,
      publishedAt,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      ogTitle: input.ogTitle || null,
      ogDescription: input.ogDescription || null,
      ogImageUrl: input.ogImageUrl || null,
      isFeatured: input.isFeatured,
      isBreaking: input.isBreaking,
      editorialPriority: input.editorialPriority,
      metadata: input.metadata || undefined
    }
  });

  await replacePostTags(post.id, input.tags);

  return prisma.post.findUniqueOrThrow({
    where: { id: post.id },
    include: publicPostInclude
  });
}

export async function updatePost(id: number, input: PostPatchInput) {
  const current = await prisma.post.findUnique({ where: { id } });
  if (!current) throw new Error('Noticia inexistente.');

  const category = input.categoryId || input.categorySlug || input.categoryName ? await resolveCategory(input) : null;
  const author = input.authorId || input.authorSlug || input.authorName ? await resolveAuthor(input) : null;
  const contentHtml = input.contentHtml ? sanitizeArticleHtml(input.contentHtml) : undefined;
  const nextSlugSource = input.slug || (input.title && input.title !== current.title ? input.title : null);
  const nextSlug = nextSlugSource ? await ensureUniquePostSlug(nextSlugSource, id) : undefined;
  const publishedAt =
    input.publishedAt === null
      ? null
      : input.publishedAt ||
        (input.status === PostStatus.PUBLISHED && !current.publishedAt ? new Date() : undefined);

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      ...(contentHtml
        ? {
            contentHtml,
            contentText: plainTextFromHtml(contentHtml)
          }
        : {}),
      ...(category ? { categoryId: category.id } : {}),
      ...(author ? { authorId: author.id } : {}),
      ...(input.sourceName !== undefined ? { sourceName: input.sourceName || null } : {}),
      ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl || null } : {}),
      ...(input.mainImage ||
      input.mainImageUrl !== undefined ||
      input.mainImageWidth !== undefined ||
      input.mainImageHeight !== undefined ||
      input.mainImageAlt !== undefined ||
      input.mainImageCaption !== undefined ||
      input.mainImageCredit !== undefined
        ? imageFields(input)
        : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(publishedAt !== undefined ? { publishedAt } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle || null } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription || null } : {}),
      ...(input.ogTitle !== undefined ? { ogTitle: input.ogTitle || null } : {}),
      ...(input.ogDescription !== undefined ? { ogDescription: input.ogDescription || null } : {}),
      ...(input.ogImageUrl !== undefined ? { ogImageUrl: input.ogImageUrl || null } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.isBreaking !== undefined ? { isBreaking: input.isBreaking } : {}),
      ...(input.editorialPriority !== undefined ? { editorialPriority: input.editorialPriority } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata || undefined } : {})
    }
  });

  if (nextSlug && nextSlug !== current.slug) {
    await prisma.redirect.upsert({
      where: { fromSlug: current.slug },
      update: { toSlug: nextSlug, postId: id },
      create: { fromSlug: current.slug, toSlug: nextSlug, postId: id }
    });
  }

  await replacePostTags(id, input.tags);

  return prisma.post.findUniqueOrThrow({
    where: { id: updated.id },
    include: publicPostInclude
  });
}
