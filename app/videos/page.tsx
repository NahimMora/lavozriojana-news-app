import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { VideoFeature } from '@/components/feed/VideoFeature';
import { VideosRail } from '@/components/feed/VideosRail';
import { getVideoCards } from '@/lib/feed';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

export const runtime = 'nodejs';
export const revalidate = 300;

const title = 'Videos';
const description = 'Reels y videos de La Voz Riojana en Instagram, con el enlace a cada noticia.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl('/videos') },
  openGraph: { type: 'website', url: absoluteUrl('/videos'), siteName: SITE_NAME, title, description },
  twitter: { card: 'summary_large_image', title, description }
};

export default async function VideosPage() {
  const [featured, ...rest] = await getVideoCards(new Date(), 25);

  return (
    <div className="videos-page">
      {/* The latest video leads the page on a dark band, with its player in place. */}
      <section className="videos-hero" aria-labelledby="videos-title">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Videos' }]} />
          <header className="videos-hero-head">
            <h1 id="videos-title">Videos</h1>
            <p>Reels y videos de nuestra cuenta de Instagram, cada uno con el enlace a su noticia.</p>
          </header>
          {featured ? (
            <VideoFeature video={featured} variant="featured" />
          ) : (
            <div className="videos-empty">
              <p>Todavía no hay videos para mostrar en esta página.</p>
              <a href="https://instagram.com/lavozriojana.ok" target="_blank" rel="noopener noreferrer">
                Ver nuestros videos en Instagram
              </a>
            </div>
          )}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="container videos-more" aria-labelledby="videos-more-title">
          <h2 className="section-title" id="videos-more-title">
            Más videos
          </h2>
          <VideosRail videos={rest} className="videos-grid" />
        </section>
      )}
    </div>
  );
}
