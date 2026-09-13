import { BannerSlot, CommentStatus, ContactMessageStatus, LeadStatus, PostStatus, SourceType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

const optionalUrl = z.string().url().max(500).optional().nullable();
const optionalText = (max = 240) => z.string().trim().max(max).optional().nullable();
const metadataSchema = z
  .record(z.unknown())
  .optional()
  .nullable()
  .transform((value) => value as Prisma.InputJsonObject | null | undefined);

export const postStatusSchema = z
  .enum(['draft', 'published', 'archived', 'DRAFT', 'PUBLISHED', 'ARCHIVED'])
  .transform((value) => value.toUpperCase() as PostStatus);

export const commentStatusSchema = z
  .enum(['pending', 'approved', 'rejected', 'PENDING', 'APPROVED', 'REJECTED'])
  .transform((value) => value.toUpperCase() as CommentStatus);

export const leadStatusSchema = z
  .enum(['active', 'inactive', 'ACTIVE', 'INACTIVE'])
  .transform((value) => value.toUpperCase() as LeadStatus);

export const mainImageSchema = z.object({
  url: z.string().url().max(500),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  alt: optionalText(240),
  caption: optionalText(320),
  credit: optionalText(180)
});

export const videoSchema = z.object({
  url: z.string().url().max(500),
  poster: z.string().url().max(500).optional().nullable()
});

export const postSourceSchema = z.object({
  name: z.string().trim().min(2).max(180),
  url: z.string().url().max(500).optional().nullable(),
  type: z.nativeEnum(SourceType).default('MEDIO')
});

export const postCreateSchema = z.object({
  title: z.string().trim().min(8).max(240),
  slug: z.string().trim().min(3).max(220).optional(),
  excerpt: z.string().trim().min(20).max(1500),
  contentHtml: z.string().min(1),
  categoryId: z.number().int().positive().optional(),
  categorySlug: z.string().trim().min(2).max(140).optional(),
  categoryName: z.string().trim().min(2).max(120).optional(),
  authorId: z.number().int().positive().optional(),
  authorSlug: z.string().trim().min(2).max(180).optional(),
  authorName: z.string().trim().min(2).max(160).optional(),
  tags: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  sourceName: optionalText(180),
  sourceUrl: optionalUrl,
  sources: z.array(postSourceSchema).max(10).optional(),
  mainImage: mainImageSchema.optional(),
  mainImageUrl: optionalUrl,
  mainImageWidth: z.number().int().positive().optional().nullable(),
  mainImageHeight: z.number().int().positive().optional().nullable(),
  mainImageAlt: optionalText(240),
  mainImageCaption: optionalText(320),
  mainImageCredit: optionalText(180),
  video: videoSchema.optional(),
  videoUrl: optionalUrl,
  videoPoster: optionalUrl,
  status: postStatusSchema.default('DRAFT'),
  publishedAt: z.coerce.date().optional().nullable(),
  seoTitle: optionalText(255),
  seoDescription: optionalText(320),
  ogTitle: optionalText(255),
  ogDescription: optionalText(320),
  ogImageUrl: optionalUrl,
  isFeatured: z.boolean().default(false),
  isBreaking: z.boolean().default(false),
  editorialPriority: z.number().int().min(0).max(1000).default(0),
  metadata: metadataSchema,
  // Historia longitudinal asignada por el Story Engine del autopublicador
  // (ver docs/EDITORIAL_CONTEXT_PROGRESS.md en el repo del autopublicador).
  // Opcional: la inmensa mayoria de notas no pertenece a ninguna historia.
  storyKey: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9:_-]+$/i, 'storyKey solo admite letras, numeros, ":", "_" y "-"')
    .optional()
    .nullable()
});

export const postPatchSchema = postCreateSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).optional(),
  description: optionalText(280),
  color: optionalText(24),
  isActive: z.boolean().optional()
});

export const categoryPatchSchema = categorySchema.partial();

export const authorSocialLinkSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'website']),
  url: z.string().url().max(500)
});

export const authorSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).optional(),
  bio: z.string().trim().max(3000).optional().nullable(),
  avatarUrl: optionalUrl,
  role: optionalText(160),
  specialty: optionalText(160),
  email: z.string().trim().email().max(180).optional().nullable(),
  socialLinks: z.array(authorSocialLinkSchema).max(6).optional().nullable(),
  isInstitutional: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const authorPatchSchema = authorSchema.partial();

export const bannerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slot: z.nativeEnum(BannerSlot),
  imageUrl: optionalUrl,
  linkUrl: optionalUrl,
  altText: optionalText(240),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  priority: z.number().int().min(0).max(1000).default(0)
});

export const bannerPatchSchema = bannerSchema.partial();

export const publicCommentSchema = z.object({
  postId: z.number().int().positive(),
  authorName: z.string().trim().min(2).max(120),
  body: z.string().trim().min(5).max(1200),
  website: z.string().optional()
});

export const privateCommentPatchSchema = z.object({
  status: commentStatusSchema.optional(),
  body: z.string().trim().min(5).max(1200).optional()
});

export const phoneLeadSchema = z.object({
  name: z.string().trim().max(120).optional().nullable(),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .regex(/^[+()\d\s.-]+$/, 'Teléfono inválido.'),
  consent: z.literal(true),
  source: z.string().trim().max(240).optional().nullable(),
  website: z.string().optional()
});

export const phoneLeadPatchSchema = z.object({
  status: leadStatusSchema
});

export const contactMessageStatusSchema = z
  .enum(['new', 'read', 'archived', 'NEW', 'READ', 'ARCHIVED'])
  .transform((value) => value.toUpperCase() as ContactMessageStatus);

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(10).max(4000),
  website: z.string().optional() // honeypot anti-spam
});

export const contactMessagePatchSchema = z.object({
  status: contactMessageStatusSchema
});
