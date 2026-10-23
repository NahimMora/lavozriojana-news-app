import Link from 'next/link';
import type { PublicPost } from '@/lib/posts';
import { formatHeadline } from '@/lib/headline';

export function MostRead({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;

  return (
    <section>
      <h2 className="section-title">Más leídas</h2>
      <ol className="rank-list">
        {posts.map((post, i) => (
          <li key={post.id}>
            <span className="rank-number" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <Link className="kicker" href={`/categoria/${post.category.slug}`}>
                {post.category.name}
              </Link>
              <Link href={`/noticias/${post.slug}`} className="rank-title">
                {formatHeadline(post.title, post.excerpt, post.contentText)}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
