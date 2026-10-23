import Link from 'next/link';
import { Suspense } from 'react';
import { getVideoCards } from '@/lib/feed';
import type { PublicPost } from '@/lib/posts';
import { VideosRail } from './VideosRail';

/**
 * "Videos" on the home page: a dark band right after the opening and the
 * services line, so it reads as its own format without displacing the
 * first screen of news. Rendered apart from the page so the feed never
 * holds the news; without videos it takes no space.
 */
export function VideosBand({ knownPosts }: { knownPosts: PublicPost[] }) {
  return (
    <Suspense fallback={null}>
      <VideosBandData knownPosts={knownPosts} />
    </Suspense>
  );
}

async function VideosBandData({ knownPosts }: { knownPosts: PublicPost[] }) {
  const videos = await getVideoCards(new Date(), 5, knownPosts);
  if (!videos.length) return null;

  return (
    <section className="videos-band" aria-labelledby="videos-band-title">
      <div className="container">
        <div className="videos-band-head">
          <h2 className="section-title" id="videos-band-title">
            Videos
          </h2>
          <Link className="videos-band-more" href="/videos">
            Ver todos los videos
          </Link>
        </div>
        <VideosRail videos={videos} className="videos-rail-band" />
      </div>
    </section>
  );
}
