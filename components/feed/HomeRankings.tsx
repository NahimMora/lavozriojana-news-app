import { Suspense } from 'react';
import { MostRead } from '@/components/news/MostRead';
import { getTrendingLists } from '@/lib/feed';
import type { PublicPost } from '@/lib/posts';
import { RankingTabs } from './RankingTabs';
import { TrendingTabs } from './TrendingTabs';

/**
 * The home ranking. "Más leídas" (visits to the site) as before; when the
 * Instagram ranking exists it joins as a second tab, with its own name and
 * note, instead of a module of its own. While the feed loads, or without
 * it, the reader sees "Más leídas" exactly as before.
 */
export function HomeRankings({ mostRead, knownPosts }: { mostRead: PublicPost[]; knownPosts: PublicPost[] }) {
  return (
    <Suspense fallback={<MostRead posts={mostRead} />}>
      <HomeRankingsData mostRead={mostRead} knownPosts={knownPosts} />
    </Suspense>
  );
}

async function HomeRankingsData({ mostRead, knownPosts }: { mostRead: PublicPost[]; knownPosts: PublicPost[] }) {
  const trending = await getTrendingLists(knownPosts);
  if (!trending) return <MostRead posts={mostRead} />;
  const instagram = <TrendingTabs day={trending.day} week={trending.week} title={null} />;
  if (!mostRead.length) {
    return (
      <section>
        <h2 className="section-title">Lo más visto en Instagram</h2>
        {instagram}
      </section>
    );
  }
  return (
    <RankingTabs
      title="Lo más visto"
      tabs={[
        { id: 'sitio', label: 'Más leídas', note: 'Las notas con más lecturas en lavozriojana.com.', panel: <MostRead posts={mostRead} heading={null} /> },
        { id: 'instagram', label: 'En Instagram', note: null, panel: instagram }
      ]}
    />
  );
}
