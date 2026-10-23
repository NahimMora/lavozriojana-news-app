import Link from 'next/link';
import type { PublicPost } from '@/lib/posts';
import { formatDate, formatWireTime } from '@/lib/format';
import { formatHeadline } from '@/lib/headline';
import { authorProfileUrl } from '@/lib/author';
import { CardImage } from './PostCardMedia';

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

/** Variantes y su escala (ver "Sistema de densidad" en globals.css):
 * lead > featured > default > compact/side > list. Los titulares se recortan
 * con line-clamp según la variante; el texto completo queda en el enlace. */
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
  // Imported headlines arrive in uppercase; the stored title is not changed.
  const headline = formatHeadline(post.title, post.excerpt, post.contentText);
  // Only media fields cross the Server/Client boundary, never article HTML.
  const mediaPost = { title: headline, mainImageUrl: post.mainImageUrl, mainImageAlt: post.mainImageAlt, videoUrl: post.videoUrl, category: post.category };
  const href = `/noticias/${post.slug}`;

  /* ── List (AHORA): hora de cable + titular ── */
  if (isList) {
    return (
      <article className="post-card list">
        <time className="list-time" dateTime={post.publishedAt?.toISOString()}>{formatWireTime(post.publishedAt)}</time>
        <Link href={href} className="post-title list-title">
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
          <Link href={href} className="post-media" aria-hidden="true" tabIndex={-1}>
            <CardImage post={mediaPost} priority={priority} sizes={imageSizes || '(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw'} autoplayInView={autoplayInView} />
            <VideoBadge post={post} />
          </Link>
          <div className="overlay-text">
            <Link className="overlay-kicker" href={`/categoria/${post.category.slug}`}>
              {post.category.name}
            </Link>
            <h2 className="overlay-title">
              <Link href={href}>{headline}</Link>
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
        <Link href={href} className="post-media" aria-hidden="true" tabIndex={-1}>
          <CardImage post={mediaPost} sizes="112px" />
          <VideoBadge post={post} />
        </Link>
        <div className="post-body">
          <Link className="kicker" href={`/categoria/${post.category.slug}`}>
            {post.category.name}
          </Link>
          <h2 className="post-title side-title">
            <Link href={href}>{headline}{post.videoUrl && <span className="sr-only">, con video</span>}</Link>
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
    variant === 'default' ? 'default' : '',
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
    ? '(min-width: 1280px) 640px, (min-width: 768px) 60vw, 100vw'
    : isHorizontal
    ? '(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw'
    : isCompact
    ? '(min-width: 768px) 112px, 104px'
    : isLarge || isFeatured
    ? '(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw'
    : '(min-width: 1024px) 420px, (min-width: 560px) 47vw, 120px');

  return (
    <article className={cardClass}>
      <Link href={href} className="post-media" aria-hidden="true" tabIndex={-1}>
        <CardImage post={mediaPost} priority={priority} sizes={mediaSizes} autoplayInView={autoplayInView} />
        <VideoBadge post={post} />
        {!isCompact && !isMini && <VideoChip post={post} />}
      </Link>

      <div className="post-body">
        <Link className="kicker" href={`/categoria/${post.category.slug}`}>
          {post.category.name}
        </Link>
        <h2 className={titleClass}>
          <Link href={href}>{headline}{post.videoUrl && <span className="sr-only">, con video</span>}</Link>
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
