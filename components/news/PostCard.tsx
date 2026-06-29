import Link from 'next/link';
import type { PublicPost } from '@/lib/posts';
import { formatDate } from '@/lib/format';

export function PostCard({
  post,
  variant = 'default',
  priority = false
}: {
  post: PublicPost;
  variant?: 'default' | 'compact' | 'large';
  priority?: boolean;
}) {
  const compact = variant === 'compact';
  const large = variant === 'large';
  const imageAlt = post.mainImageAlt || post.title;

  return (
    <article className={`post-card ${compact ? 'compact' : ''}`}>
      <Link href={`/noticias/${post.slug}`} className="post-media" aria-label={post.title}>
        {post.mainImageUrl ? (
          <img
            src={post.mainImageUrl}
            alt={imageAlt}
            width={post.mainImageWidth || undefined}
            height={post.mainImageHeight || undefined}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <span className="media-fallback">La Voz Riojana</span>
        )}
      </Link>
      <div>
        <Link className="kicker" href={`/categoria/${post.category.slug}`}>
          {post.category.name}
        </Link>
        <h2 className={`post-title ${large ? 'large' : ''}`}>
          <Link href={`/noticias/${post.slug}`}>{post.title}</Link>
        </h2>
        {!compact && <p className="post-excerpt">{post.excerpt}</p>}
        <div className="post-meta">
          <span>{post.author.name}</span>
          <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
        </div>
      </div>
    </article>
  );
}
