import { prisma } from '@/lib/prisma';

export function slugify(value: string, fallback = 'nota') {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);

  return slug || fallback;
}

export async function ensureUniquePostSlug(titleOrSlug: string, excludeId?: number) {
  const base = slugify(titleOrSlug, 'noticia');
  const existing = await prisma.post.findMany({
    where: {
      slug: { startsWith: base },
      ...(excludeId ? { NOT: { id: excludeId } } : {})
    },
    select: { slug: true }
  });

  const used = new Set(existing.map((item) => item.slug));
  if (!used.has(base)) return base;

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function ensureUniqueCategorySlug(nameOrSlug: string, excludeId?: number) {
  const base = slugify(nameOrSlug, 'categoria');
  const existing = await prisma.category.findMany({
    where: {
      slug: { startsWith: base },
      ...(excludeId ? { NOT: { id: excludeId } } : {})
    },
    select: { slug: true }
  });

  const used = new Set(existing.map((item) => item.slug));
  if (!used.has(base)) return base;

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function ensureUniqueAuthorSlug(nameOrSlug: string, excludeId?: number) {
  const base = slugify(nameOrSlug, 'autor');
  const existing = await prisma.author.findMany({
    where: {
      slug: { startsWith: base },
      ...(excludeId ? { NOT: { id: excludeId } } : {})
    },
    select: { slug: true }
  });

  const used = new Set(existing.map((item) => item.slug));
  if (!used.has(base)) return base;

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
