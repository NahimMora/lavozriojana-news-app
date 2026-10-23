import Link from 'next/link';
import type { PublicPost } from '@/lib/posts';
import { formatDate } from '@/lib/format';
import { authorProfileUrl } from '@/lib/author';
import { CardImage } from './PostCardMedia';
import { formatHeadline } from '@/lib/headline';

const playIconPath = 'M9.5 8.2v7.6c0 .58.62.94 1.12.65l6.4-3.8a.75.75 0 0 0 0-1.3l-6.4-3.8a.75.75 0 0 0-1.12.65Z';

function VideoBadge({ post }: { post: PublicPost }) {
  if (!post.videoUrl) return null;

  return (
    <span className="video-badge" aria-label="Contiene video">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={playIconPath} fill="currentColor" />
      </svg>
    </span>
  );
}

/** Chip "Video" en la esquina, visible antes de pasar el mouse — en cards
 * chicas (compact/mini/side) el circulo central ya alcanza. */
function VideoChip({ post }: { post: PublicPost }) {
  if (!post.videoUrl) return null;

  return (
    <span className="video-chip" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d={playIconPath} fill="currentColor" />
      </svg>
      Video
    </span>
  );
}

export function PostCard({
  post,
  variant = 'default',
  priority = false,
  autoplayInView = false,
  imageSizes
}: {
  post: PublicPost;
  variant?: 'default' | 'lead' | 'compact' | 'large' | 'featured' | 'horizontal' | 'mini' | 'list' | 'overlay' | 'side';
  imageSizes?: string;
  priority?: boolean;
  /** Avance de video sin hover, apenas la card entra en pantalla — solo
   * pensado para el home (ver app/page.tsx). */
  autoplayInView?: boolean;
}) {
  const isCompact    = variant === 'compact';
  const isHorizontal = variant === 'horizontal';
  const isMini       = variant === 'mini';
  const isLarge      = variant === 'large';
  const isFeatured   = variant === 'featured';
  const isList       = variant === 'list';
  const isOverlay    = variant === 'overlay';
  const isSide       = variant === 'side';
  const isLead       = variant === 'lead';
  const headline = formatHeadline(post.title, post.excerpt);
  // Only media fields cross the Server/Client boundary, never article HTML.
  const mediaPost = { title: post.title, mainImageUrl: post.mainImageUrl, mainImageAlt: post.mainImageAlt, videoUrl: post.videoUrl, category: post.category };

  /* ── List (AHORA) ──────────────────────────── */
  if (isList) {
    return (
      <article className="post-card list">
        <Link className="kicker" href={`/categoria/${post.category.slug}`}>
          {post.category.name}
        </Link>
        <Link href={`/noticias/${post.slug}`} className="post-title list-title">
          {headline}
        </Link>
      </article>
    );
  }

  /* ── Overlay (title on image) ──────────────── */
  if (isOverlay) {
    return (
      <article className="post-card overlay">
        <div className="overlay-wrap">
          <Link href={`/noticias/${post.slug}`} className="post-media" aria-label={post.title}>
            <CardImage post={mediaPost} priority={priority} sizes={imageSizes || '(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw'} autoplayInView={autoplayInView} />
            <VideoBadge post={post} />
          </Link>
          <div className="overlay-text">
            <Link className="overlay-kicker" href={`/categoria/${post.category.slug}`}>
              {post.category.name}
            </Link>
            <h2 className="overlay-title">
              <Link href={`/noticias/${post.slug}`}>{headline}</Link>
            </h2>
            {post.excerpt && (
              <p className="overlay-excerpt">{post.excerpt}</p>
            )}
          </div>
        </div>
      </article>
    );
  }

  /* ── Side (article sidebar) ────────────────── */
  if (isSide) {
    return (
      <article className="post-card side">
        <Link href={`/noticias/${post.slug}`} className="post-media" aria-label={post.title}>
          <CardImage post={mediaPost} sizes="112px" />
          <VideoBadge post={post} />
        </Link>
        <div>
          <Link className="kicker" href={`/categoria/${post.category.slug}`}>
            {post.category.name}
          </Link>
          <h2 className="post-title" style={{ fontSize: '.84rem', marginTop: 3 }}>
            <Link href={`/noticias/${post.slug}`}>{headline}</Link>
          </h2>
          <div className="post-meta">
            <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
          </div>
        </div>
      </article>
    );
  }

  /* ── Standard variants ─────────────────────── */
  const cardClass = [
    'post-card',
    isLead       ? 'lead'       : '',
    isFeatured   ? 'featured'   : '',
    isLarge      ? 'large'      : '',
    isCompact    ? 'compact'    : '',
    isHorizontal ? 'horizontal' : '',
    isMini       ? 'mini'       : '',
  ].filter(Boolean).join(' ');

  const titleClass = isLead    ? 'post-title lead-title'
    : isLarge   ? 'post-title large'
    : isFeatured ? 'post-title featured'
    : isMini     ? 'post-title mini-title'
    : 'post-title';

  const showExcerpt = (isLead || isLarge || isFeatured || isHorizontal || variant === 'default') && !!post.excerpt;

  /* El tamaño real renderizado varía mucho por variante — si sizes queda
     corto, Next.js sirve una imagen más chica que el contenedor y el
     navegador la estira (se ve pixelada). */
  const mediaSizes = imageSizes || (isLead
    ? '(min-width: 1280px) 860px, (min-width: 768px) 65vw, 100vw'
    : isHorizontal
    ? '(min-width: 1280px) 620px, (min-width: 768px) 45vw, 100vw'
    : isCompact
    ? '(min-width: 768px) 96px, 104px'
    : isLarge || isFeatured
    ? '(min-width: 768px) 58vw, 100vw'
    : '(min-width: 1280px) 400px, (min-width: 900px) 25vw, (min-width: 560px) 47vw, 100vw');

  return (
    <article className={cardClass}>
      <Link href={`/noticias/${post.slug}`} className="post-media" aria-label={post.title}>
        <CardImage post={mediaPost} priority={priority} sizes={mediaSizes} autoplayInView={autoplayInView} />
        <VideoBadge post={post} />
        {!isCompact && !isMini && <VideoChip post={post} />}
      </Link>

      <div className="post-card-copy">
        <Link className="kicker" href={`/categoria/${post.category.slug}`}>
          {post.category.name}
        </Link>
        <h2 className={titleClass}>
          <Link href={`/noticias/${post.slug}`}>{headline}</Link>
        </h2>
        {showExcerpt && (
          <p className={`post-excerpt${isFeatured ? ' short' : ''}`}>{post.excerpt}</p>
        )}
        {!isMini && (
          <div className="post-meta">
            <Link href={authorProfileUrl(post.author.slug)}>{post.author.name}</Link>
            <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
          </div>
        )}
      </div>
    </article>
  );
}
