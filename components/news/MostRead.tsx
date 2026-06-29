import Link from 'next/link';
import type { PublicPost } from '@/lib/posts';

export function MostRead({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;

  return (
    <section>
      <h2 className="section-title">Más leídas</h2>
      <ol className="rank-list">
        {posts.map((post, index) => (
          <li key={post.id}>
            <span className="rank-number">{index + 1}</span>
            <div>
              <Link className="kicker" href={`/categoria/${post.category.slug}`}>
                {post.category.name}
              </Link>
              <Link href={`/noticias/${post.slug}`} style={{ display: 'block', fontWeight: 800, lineHeight: 1.25 }}>
                {post.title}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
