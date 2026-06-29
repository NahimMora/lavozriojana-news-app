import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { BannerAd } from '@/components/news/BannerAd';
import { ArticleBody } from '@/components/news/ArticleBody';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { PostCard } from '@/components/news/PostCard';
import { ShareLinks } from '@/components/news/ShareLinks';
import { CommentForm } from '@/components/forms/CommentForm';
import { formatDateTime } from '@/lib/format';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site';
import { getPostBySlug, getRelatedPosts, publicPostInclude } from '@/lib/posts';
import { prisma } from '@/lib/prisma';
import { recordPostView } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) {
    return {
      title: 'Noticia no encontrada'
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const image = post.ogImageUrl || post.mainImageUrl || DEFAULT_OG_IMAGE;
  const url = absoluteUrl(`/noticias/${post.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      images: [{ url: image }],
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      section: post.category.name
    },
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      images: [image]
    }
  };
}

export default async function NewsPage({ params }: Props) {
  const post = await getPostBySlug(params.slug).catch(() => null);

  if (!post) {
    const redirectRow = await prisma.redirect.findUnique({ where: { fromSlug: params.slug } }).catch(() => null);
    if (redirectRow) redirect(`/noticias/${redirectRow.toSlug}`);
    notFound();
  }

  await recordPostView(post.id, headers()).catch(() => null);

  const [related, mostRead] = await Promise.all([
    getRelatedPosts(post).catch(() => []),
    prisma.post
      .findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, id: { not: post.id } },
        include: publicPostInclude,
        orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
        take: 4
      })
      .catch(() => [])
  ]);

  const articleUrl = absoluteUrl(`/noticias/${post.slug}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: [post.ogImageUrl || post.mainImageUrl || DEFAULT_OG_IMAGE],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author.name
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/brand-logo.svg`
      }
    },
    mainEntityOfPage: articleUrl,
    articleSection: post.category.name
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <Breadcrumbs
          items={[
            { label: post.category.name, href: `/categoria/${post.category.slug}` },
            { label: post.title }
          ]}
        />
      </div>
      <header className="article-header">
        <a className="kicker" href={`/categoria/${post.category.slug}`}>
          {post.category.name}
        </a>
        <h1 className="article-title">{post.title}</h1>
        <p className="article-lead">{post.excerpt}</p>
        <div className="post-meta">
          <span>{post.author.name}</span>
          <time dateTime={post.publishedAt?.toISOString()}>{formatDateTime(post.publishedAt)}</time>
          <span>Actualizado {formatDateTime(post.updatedAt)}</span>
        </div>
        <ShareLinks title={post.title} path={`/noticias/${post.slug}`} />
      </header>

      {post.mainImageUrl && (
        <figure className="container article-figure">
          <img
            src={post.mainImageUrl}
            alt={post.mainImageAlt || post.title}
            width={post.mainImageWidth || undefined}
            height={post.mainImageHeight || undefined}
            loading="eager"
          />
          {(post.mainImageCaption || post.mainImageCredit) && (
            <figcaption>
              {post.mainImageCaption}
              {post.mainImageCredit ? ` Foto: ${post.mainImageCredit}` : ''}
            </figcaption>
          )}
        </figure>
      )}

      <div className="container article-content-wrap">
        <div>
          <BannerAd slot="ARTICLE_INLINE" />
          <ArticleBody html={post.contentHtml} />
          {post.sourceName && <p className="lr-source">Fuente: {post.sourceName}</p>}
          <BannerAd slot="ARTICLE_AFTER_CONTENT" />

          <section className="section">
            <h2 className="section-title">Comentarios</h2>
            <div className="comment-list">
              {post.comments.length === 0 && <p className="muted">Todavía no hay comentarios aprobados.</p>}
              {post.comments.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  <strong>{comment.authorName}</strong>
                  <p>{comment.body}</p>
                </div>
              ))}
            </div>
            <CommentForm postId={post.id} />
          </section>
        </div>
        <aside className="sidebar">
          <BannerAd slot="SIDEBAR" />
          <section>
            <h2 className="section-title">Más noticias</h2>
            <div className="comment-list">
              {(related.length ? related : mostRead).map((item) => (
                <PostCard post={item} variant="compact" key={item.id} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
}
