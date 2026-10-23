import Link from 'next/link';
import type { PublicPost } from '@/lib/posts';
import { formatHeadline } from '@/lib/headline';

/** Visits to the site. With `heading={null}` only the list is rendered (inside the home ranking tabs). */
export function MostRead({ posts, heading = 'Más leídas' }: { posts: PublicPost[]; heading?: string | null }) {
  if (!posts.length) return null;

  const list = (
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
  );
  if (heading === null) return list;

  return (
    <section>
      <h2 className="section-title">{heading}</h2>
      {list}
    </section>
  );
}
