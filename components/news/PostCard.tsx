import Link from 'next/link';
import Image from 'next/image';
import type { PublicPost } from '@/lib/posts';
import { formatDate } from '@/lib/format';

function CategoryFallback({ slug, name }: { slug: string; name: string }) {
  return (
    <span className={`category-fallback category-${slug}`}>
      <span className="cf-badge">{name}</span>
      <span className="cf-brand">La Voz Riojana</span>
    </span>
  );
}

function CardImage({
  post,
  priority = false,
  sizes
}: {
  post: PublicPost;
  priority?: boolean;
  sizes: string;
}) {
  if (!post.mainImageUrl) return null;

  return (
    <Image
      src={post.mainImageUrl}
      alt={post.mainImageAlt || post.title}
      fill
      sizes={sizes}
      priority={priority}
      style={{ objectFit: 'cover' }}
    />
  );
}

export function PostCard({
  post,
  variant = 'default',
  priority = false
}: {
  post: PublicPost;
  variant?: 'default' | 'compact' | 'large' | 'featured' | 'horizontal' | 'mini' | 'list' | 'overlay' | 'side';
  priority?: boolean;
}) {
  const isCompact    = variant === 'compact';
  const isHorizontal = variant === 'horizontal';
  const isMini       = variant === 'mini';
  const isLarge      = variant === 'large';
  const isFeatured   = variant === 'featured';
  const isList       = variant === 'list';
  const isOverlay    = variant === 'overlay';
  const isSide       = variant === 'side';

  /* ── List (AHORA) ──────────────────────────── */
  if (isList) {
    return (
      <article className="post-card list">
        <Link className="kicker" href={`/categoria/${post.category.slug}`}>
          {post.category.name}
        </Link>
        <Link href={`/noticias/${post.slug}`} className="post-title list-title">
          {post.title}
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
            {post.mainImageUrl ? (
              <CardImage post={post} priority={priority} sizes="(min-width: 900px) 55vw, 100vw" />
            ) : (
              <CategoryFallback slug={post.category.slug} name={post.category.name} />
            )}
          </Link>
          <div className="overlay-text">
            <Link className="overlay-kicker" href={`/categoria/${post.category.slug}`}>
              {post.category.name}
            </Link>
            <h2 className="overlay-title">
              <Link href={`/noticias/${post.slug}`}>{post.title}</Link>
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
          {post.mainImageUrl ? (
            <CardImage post={post} sizes="112px" />
          ) : (
            <CategoryFallback slug={post.category.slug} name={post.category.name} />
          )}
        </Link>
        <div>
          <Link className="kicker" href={`/categoria/${post.category.slug}`}>
            {post.category.name}
          </Link>
          <h2 className="post-title" style={{ fontSize: '.84rem', marginTop: 3 }}>
            <Link href={`/noticias/${post.slug}`}>{post.title}</Link>
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
    isCompact    ? 'compact'    : '',
    isHorizontal ? 'horizontal' : '',
    isMini       ? 'mini'       : '',
  ].filter(Boolean).join(' ');

  const titleClass = isLarge   ? 'post-title large'
    : isFeatured ? 'post-title featured'
    : isMini     ? 'post-title mini-title'
    : 'post-title';

  const showExcerpt = (isLarge || isFeatured || variant === 'default') && !!post.excerpt;

  return (
    <article className={cardClass}>
      <Link href={`/noticias/${post.slug}`} className="post-media" aria-label={post.title}>
        {post.mainImageUrl ? (
          <CardImage
            post={post}
            priority={priority}
            sizes={isHorizontal ? '(min-width: 768px) 160px, 100vw' : isCompact ? '68px' : '33vw'}
          />
        ) : (
          <CategoryFallback slug={post.category.slug} name={post.category.name} />
        )}
      </Link>

      <div>
        <Link className="kicker" href={`/categoria/${post.category.slug}`}>
          {post.category.name}
        </Link>
        <h2 className={titleClass}>
          <Link href={`/noticias/${post.slug}`}>{post.title}</Link>
        </h2>
        {showExcerpt && (
          <p className={`post-excerpt${isFeatured ? ' short' : ''}`}>{post.excerpt}</p>
        )}
        {!isMini && (
          <div className="post-meta">
            <span>Redacción</span>
            <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
          </div>
        )}
      </div>
    </article>
  );
}
