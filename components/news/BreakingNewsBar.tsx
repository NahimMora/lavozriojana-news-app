import Link from 'next/link';
import type { PublicPost } from '@/lib/posts';

export function BreakingNewsBar({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;

  return (
    <div className="breaking-bar">
      <div className="container breaking-inner">
        <span className="breaking-label">Último Momento</span>
        <div className="breaking-items">
          {posts.map((post) => (
            <Link href={`/noticias/${post.slug}`} key={post.id}>
              {post.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
