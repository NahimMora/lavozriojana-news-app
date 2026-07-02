import type { PublicPost } from '@/lib/posts';
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
