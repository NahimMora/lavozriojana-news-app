import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { BannerAd } from '@/components/news/BannerAd';
import { ArticleBody, ArticleLead } from '@/components/news/ArticleBody';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { PostCard } from '@/components/news/PostCard';
import { PostViewTracker } from '@/components/news/PostViewTracker';
import { ShareLinks } from '@/components/news/ShareLinks';
import { CommentForm } from '@/components/forms/CommentForm';
import { InfiniteArticleFeed } from '@/components/news/InfiniteArticleFeed';
import { estimateReadingMinutes, formatDate, formatDateTime } from '@/lib/format';
import { absoluteUrl, SITE_LOGO_URL, SITE_NAME, SITE_URL } from '@/lib/site';
import { postDocumentTitle, postModifiedDate, postSocialImage } from '@/lib/seo';
import { getPostBySlug, getRelatedPosts, publicPostInclude } from '@/lib/posts';
import { prisma } from '@/lib/prisma';
import { splitArticleHtmlAfterParagraphs, splitFirstArticleParagraph } from '@/lib/article-html';

export const runtime = 'nodejs';
export const revalidate = 60;

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) return { title: 'Noticia no encontrada' };

  const title = postDocumentTitle(post);
  const description = post.seoDescription || post.excerpt;
  const image = postSocialImage(post);
  const modifiedDate = postModifiedDate(post);
  const url = absoluteUrl(`/noticias/${post.slug}`);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title: post.ogTitle || post.title,
      description: post.ogDescription || description,
      images: [{ url: image, width: 1200, height: 630 }],
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: modifiedDate.toISOString(),
      authors: [post.author.name],
      section: post.category.name
    },
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || post.title,
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

  const [related, mostRead] = await Promise.all([
    getRelatedPosts(post, 7).catch(() => []),
    prisma.post
      .findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, id: { not: post.id } },
        include: publicPostInclude,
        orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
        take: 7
      })
      .catch(() => [])
  ]);

  const readingMinutes = estimateReadingMinutes(post.contentText);
  const articleUrl = absoluteUrl(`/noticias/${post.slug}`);
  const articleImage = postSocialImage(post);
  const modifiedDate = postModifiedDate(post);
  const relatedOrMostRead = (related.length ? related : mostRead).slice(0, 3);
  const sidebarItems = (related.length ? related : mostRead).slice(0, 7);
  const articleParts = splitFirstArticleParagraph(post.contentHtml);
  const bodyParts = splitArticleHtmlAfterParagraphs(articleParts.restHtml, 2);
  const articleTags = post.tags
    .map((item) => item.tag)
    .filter((tag, index, tags) => {
      const name = tag.name.trim();
      if (!name) return false;

      const normalized = name.toLowerCase();
      const categoryName = post.category.name.trim().toLowerCase();
      return normalized !== categoryName && tags.findIndex((item) => item.name.trim().toLowerCase() === normalized) === index;
    })
    .slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${articleUrl}#article`,
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: [articleImage],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: modifiedDate.toISOString(),
    inLanguage: 'es-AR',
    isAccessibleForFree: true,
    url: articleUrl,
    author: { '@type': 'Person', name: post.author.name },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}#organization`,
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_LOGO_URL, width: 1254, height: 1254 }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    articleSection: post.category.name,
    keywords: articleTags.map((tag) => tag.name)
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: SITE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.category.name,
        item: absoluteUrl(`/categoria/${post.category.slug}`)
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: articleUrl
      }
    ]
  };

  return (
    <>
      <article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

        <div className="container">
          <Breadcrumbs
            items={[
              { label: post.category.name, href: `/categoria/${post.category.slug}` },
              { label: post.title }
            ]}
          />
        </div>

        {/* Main grid: body column + sidebar */}
        <div className="container article-content-wrap">
          {/* ── Body column ── */}
          <div className="article-main">
            {/* Article header */}
            <header className="article-header">
              <div className="article-topic-row" aria-label="Temas de la noticia">
                <a className="article-topic-chip article-topic-chip-primary" href={`/categoria/${post.category.slug}`}>
                  {post.category.name}
                </a>
                {articleTags.map((tag) => (
                  <a className="article-topic-chip" href={`/buscar?q=${encodeURIComponent(tag.name)}`} key={tag.slug}>
                    {tag.name}
                  </a>
                ))}
              </div>

              <h1 className="article-title">{post.title}</h1>
              <ArticleLead html={articleParts.firstParagraphHtml} fallback={post.excerpt} />

              <div className="article-byline">
                <span className="article-byline-author">Por {post.author.name}</span>
                <span className="article-byline-sep">·</span>
                <time className="article-byline-meta" dateTime={post.publishedAt?.toISOString()}>
                  {formatDate(post.publishedAt)}
                </time>
                {post.updatedAt && (
                  <>
                    <span className="article-byline-sep">·</span>
                    <span className="article-byline-meta">
                      Act: {formatDateTime(post.updatedAt)}
                    </span>
                  </>
                )}
                <span className="article-byline-sep">·</span>
                <span className="reading-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {readingMinutes} min
                </span>
              </div>

              {post.sourceName && (
                <p className="article-source-note">
                  Fuente:{' '}
                  {post.sourceUrl ? (
                    <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {post.sourceName}
                    </a>
                  ) : (
                    <span>{post.sourceName}</span>
                  )}
                </p>
              )}

              <ShareLinks title={post.title} path={`/noticias/${post.slug}`} />
            </header>

            {/* Hero image */}
            <figure className="article-figure">
              {post.mainImageUrl ? (
                <Image
                  src={post.mainImageUrl}
                  alt={post.mainImageAlt || post.title}
                  width={post.mainImageWidth || 1200}
                  height={post.mainImageHeight || 675}
                  priority
                  sizes="(min-width: 980px) 760px, 100vw"
                />
              ) : (
                <div className={`article-image-fallback category-fallback category-${post.category.slug}`}>
                  <span className="cf-badge">{post.category.name}</span>
                  <span className="cf-brand">La Voz Riojana</span>
                </div>
              )}
              {(post.mainImageCaption || post.mainImageCredit || !post.mainImageUrl) && (
                <figcaption>
                  {post.mainImageCaption || `Imagen editorial — ${post.category.name}.`}
                  {post.mainImageCredit ? ` Foto: ${post.mainImageCredit}` : ''}
                </figcaption>
              )}
            </figure>

            {/* Article body */}
            <ArticleBody html={bodyParts.beforeHtml} />

            {bodyParts.beforeHtml && bodyParts.afterHtml && (
              <div className="article-body-ad">
                <BannerAd slot="ARTICLE_INLINE" />
              </div>
            )}

            <ArticleBody html={bodyParts.afterHtml} />

            <BannerAd slot="ARTICLE_AFTER_CONTENT" />

            {/* Related articles */}
            {relatedOrMostRead.length > 0 && (
              <section className="section">
                <h2 className="section-title">También puede interesarte</h2>
                <div className="editorial-grid">
                  {relatedOrMostRead.map((item) => (
                    <PostCard post={item} key={item.id} />
                  ))}
                </div>
              </section>
            )}

            {/* Comments */}
            <section className="section topline">
              <h2 className="section-title">Comentarios</h2>
              <div className="comment-list">
                {post.comments.length === 0 && (
                  <p className="muted">Sé el primero en comentar.</p>
                )}
                {post.comments.map((comment) => (
                  <div className="comment-item" key={comment.id}>
                    <strong>{comment.authorName}</strong>
                    <p>{comment.body}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <CommentForm postId={post.id} />
              </div>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <aside className="sidebar" aria-label="Contenido relacionado">
            <BannerAd slot="SIDEBAR" />

            <section>
              <h2 className="section-title blue">Más de La Rioja</h2>
              <div className="sidebar-hi-list" style={{ marginTop: 10 }}>
                {sidebarItems.map((item) => (
                  <article key={item.id} className="sidebar-hi-item">
                    <div className="sidebar-hi-text">
                      <a className="kicker" href={`/categoria/${item.category.slug}`}>
                        {item.category.name}
                      </a>
                      <h3 className="sidebar-hi-title">
                        <a href={`/noticias/${item.slug}`}>{item.title}</a>
                      </h3>
                      {item.publishedAt && (
                        <time className="inline-rel-date">{formatDate(item.publishedAt)}</time>
                      )}
                    </div>
                    {item.mainImageUrl && (
                      <a href={`/noticias/${item.slug}`} className="sidebar-hi-thumb">
                        <Image src={item.mainImageUrl} alt="" fill sizes="62px" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* Seguinos */}
            <section className="sidebar-social" style={{ marginTop: 22 }}>
              <h2 className="section-title">Seguinos</h2>
              <div className="sidebar-social-links">
                <a href="https://facebook.com/lavozriojana" target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  Facebook
                </a>
                <a href="https://instagram.com/lavozriojana" target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>
                  Instagram
                </a>
              </div>
            </section>

            {/* Mini WhatsApp CTA */}
            <div className="sidebar-wa-cta">
              <p className="sidebar-wa-title">Recibí las noticias por WhatsApp</p>
              <a
                href="https://wa.me/5493804000000?text=Hola%2C%20quiero%20recibir%20las%20noticias%20de%20La%20Voz%20Riojana"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-wa-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Sumarme al grupo
              </a>
            </div>
          </aside>
        </div>
      </article>

      {/* Infinite scroll: next articles load progressively below */}
      <div className="container" style={{ paddingBottom: 48 }}>
        <InfiniteArticleFeed initialSlug={post.slug} />
      </div>
      <PostViewTracker postId={post.id} />
    </>
  );
}
