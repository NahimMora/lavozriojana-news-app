import type { PublicPost } from '@/lib/posts';
import { formatTime } from '@/lib/format';
import { formatHeadline } from '@/lib/headline';
import { NewsTicker } from './NewsTicker';

export function BreakingNewsBar({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;

  return <NewsTicker items={posts.map(post => ({ slug: post.slug, title: formatHeadline(post.title, post.excerpt), time: formatTime(post.publishedAt), dateTime: post.publishedAt?.toISOString() }))} />;
}
