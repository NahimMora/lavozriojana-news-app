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

/**
 * Metadata (title/description/canonical/OG) para páginas institucionales
 * (/quienes-somos, /contacto, /politica-editorial, etc.) a partir de StaticPage.
 * Evita el patrón anterior de `metadata = { title }` sin description ni canonical.
 */
export async function institutionalMetadata(slug: string, fallbackTitle: string): Promise<Metadata> {
  const page = await getStaticPage(slug);
  const title = page?.seoTitle || page?.title || fallbackTitle;
  const description = page?.seoDescription || undefined;
  const url = absoluteUrl(`/${slug}`);

  return {
    title: page?.title || fallbackTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title,
      description
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };
}
