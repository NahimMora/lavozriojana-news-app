'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import type { VideoCardData } from '@/lib/feed';
import { INSTAGRAM_PRIVACY_NOTE, InstagramPlayer } from './InstagramPlayer';
import { VideoThumb } from './VideoCard';

/**
 * One video given room of its own: inside the story it belongs to
 * (`article`) or as the latest one at the top of /videos (`featured`). The
 * player replaces the cover in place, only when the reader asks.
 */
export function VideoFeature({ video, variant }: { video: VideoCardData; variant: 'article' | 'featured' }) {
  const [playing, setPlaying] = useState(false);
  const titleId = useId();
  const Heading = variant === 'featured' ? 'h2' : 'h3';

  return (
    <section className={`video-feature is-${variant}${playing ? ' is-playing' : ''}`} aria-labelledby={titleId}>
      <div className="video-feature-media">
        {playing ? (
          <InstagramPlayer title={video.title} permalink={video.permalink} embedUrl={video.embedUrl} videoUrl={video.videoUrl} poster={video.thumbnail} />
        ) : (
          <button type="button" className="video-feature-cover" onClick={() => setPlaying(true)}>
            <VideoThumb src={video.thumbnail} />
            <span className="video-card-play" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            <span className="sr-only">Reproducir video: {video.title}</span>
          </button>
        )}
      </div>
      <div className="video-feature-body">
        <p className="video-feature-kicker">{variant === 'article' ? 'Video de esta noticia' : 'Último video'}</p>
        <Heading className="video-feature-title" id={titleId}>
          {video.title}
        </Heading>
        <p className="video-card-meta">
          <time dateTime={video.dateTime}>{video.dateLabel}</time>
          {video.credit && (
            <>
              {' · '}
              {video.credit.href ? (
                <a href={video.credit.href} target="_blank" rel="noopener noreferrer">
                  Video: {video.credit.label}
                </a>
              ) : (
                <>Video: {video.credit.label}</>
              )}
            </>
          )}
        </p>
        <div className="video-feature-actions">
          {!playing && (
            <button type="button" className="video-feature-play" onClick={() => setPlaying(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
              Ver video
            </button>
          )}
          <a className="video-feature-link" href={video.permalink} target="_blank" rel="noopener noreferrer">
            Ver en Instagram
          </a>
          {variant !== 'article' && video.notePath && (
            <Link className="video-feature-link" href={video.notePath}>
              Leé la noticia
            </Link>
          )}
        </div>
        <p className="video-feature-privacy">{INSTAGRAM_PRIVACY_NOTE}</p>
      </div>
    </section>
  );
}
