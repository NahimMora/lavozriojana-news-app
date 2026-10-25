import type { Metadata } from 'next';
import type { PublicPost } from '@/lib/posts';
import { getStaticPage } from '@/lib/static-pages';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';

type SeoPost = PublicPost & {
  seoTitle?: string | null;
  ogImageUrl?: string | null;
};

export function postDocumentTitle(post: SeoPost) {
  const rawTitle = (post.seoTitle || post.title).trim();
  return rawTitle.includes(SITE_NAME) ? rawTitle : `${rawTitle} | ${SITE_NAME}`;
}

export function postSocialImage(post: Pick<SeoPost, 'title' | 'category' | 'mainImageUrl' | 'ogImageUrl'>) {
  if (post.ogImageUrl || post.mainImageUrl) return post.ogImageUrl || post.mainImageUrl || DEFAULT_OG_IMAGE;

  const params = new URLSearchParams({
    title: post.title,
    category: post.category.name
  });
  return absoluteUrl(`/og/article?${params.toString()}`);
}

export function postModifiedDate(post: Pick<SeoPost, 'updatedAt'>) {
  return post.updatedAt;
}

/* Next.js replaces `alternates` and `openGraph` whole when a page defines them,
   so each page has to repeat the feeds and the default share image. */
export const FEED_ALTERNATES = {
  'application/rss+xml': '/feed.xml',
  'application/atom+xml': '/atom.xml'
};

type PageMetadataInput = {
  path: string;
  title: string;
  description?: string;
  /* Title for social cards when the document title is different. */
  socialTitle?: string;
  type?: 'website' | 'profile';
  image?: string;
};

/** Title, description, canonical, feeds and social cards for a non-article page. */
export function pageMetadata({ path, title, description, socialTitle, type = 'website', image = DEFAULT_OG_IMAGE }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const cardTitle = socialTitle || title;

  return {
    title,
    description,
    alternates: { canonical: url, types: FEED_ALTERNATES },
    openGraph: {
      type,
      locale: 'es_AR',
      url,
      siteName: SITE_NAME,
      title: cardTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }]
    },
    twitter: {
      card: 'summary_large_image',
      title: cardTitle,
      description,
      images: [image]
    }
  };
}

/** Metadata for a URL that resolves to a 404: no canonical, never indexed. */
export function notFoundMetadata(title: string): Metadata {
  return {
    title,
    alternates: { canonical: null },
    robots: { index: false, follow: true }
  };
}

/** `?page=` as a positive integer; anything else (`abc`, `0`, `2.5`) means page 1. */
export function parsePageParam(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

/**
 * Metadata (title/description/canonical/OG) para páginas institucionales
 * (/quienes-somos, /contacto, /politica-editorial, etc.) a partir de StaticPage.
 * Evita el patrón anterior de `metadata = { title }` sin description ni canonical.
 */
export async function institutionalMetadata(slug: string, fallbackTitle: string): Promise<Metadata> {
  const page = await getStaticPage(slug);
  return pageMetadata({
    path: `/${slug}`,
    title: page?.title || fallbackTitle,
    socialTitle: page?.seoTitle || page?.title || fallbackTitle,
    description: page?.seoDescription || undefined
  });
}
