import Link from 'next/link';
import type { PublicPost } from '@/lib/posts';
import { formatTime } from '@/lib/format';

export function BreakingNewsBar({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;

  return (
    <div className="breaking-bar" role="region" aria-label="Últimas noticias">
      <div className="container breaking-inner">
        <span className="breaking-label" aria-hidden="true">
          <span className="breaking-dot" />
          Último momento
        </span>
        <div className="breaking-ticker">
          <div className="breaking-track">
            <div className="breaking-items">
              {posts.map((post) => (
                <Link href={`/noticias/${post.slug}`} key={post.id}>
                  <time dateTime={post.publishedAt?.toISOString()}>{formatTime(post.publishedAt)}</time>
                  <span>{post.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
