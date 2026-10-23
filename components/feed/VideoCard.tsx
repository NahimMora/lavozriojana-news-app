'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { VideoCardData } from '@/lib/feed';
import { OverlayDialog } from '@/components/layout/OverlayDialog';
import { InstagramEmbed } from './InstagramEmbed';

/**
 * Instagram serves thumbnails through signed URLs that expire. They are shown
 * as plain images (not next/image: they are not cached nor added to the
 * image domains) and replaced by a neutral panel when they fail.
 */
export function VideoThumb({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(!src);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // An error before hydration fires no onError: check the loaded state too.
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed || !src) {
    return (
      <span className="video-thumb-fallback" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r=".5" fill="currentColor" />
        </svg>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- temporary signed CDN URL, intentionally outside next/image
    <img ref={imgRef} src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  );
}

/** A light card; Instagram's player loads only when the reader opens the video. */
export function VideoCard({ video }: { video: VideoCardData }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <article className="video-card">
      <button ref={buttonRef} type="button" className="video-card-media" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <VideoThumb src={video.thumbnail} />
        <span className="video-card-play" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
        <span className="sr-only">Ver video: {video.title}</span>
      </button>
      <h3 className="video-card-title">{video.title}</h3>
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
      {video.notePath && (
        <Link className="video-card-note" href={video.notePath}>
          Leé la noticia
        </Link>
      )}

      {open && (
        <OverlayDialog title="Video" className="video-dialog" onClose={() => setOpen(false)} returnFocusRef={buttonRef}>
          <p className="video-dialog-title">{video.title}</p>
          <InstagramEmbed permalink={video.permalink} title={video.title} />
          <p className="video-dialog-links">
            <a href={video.permalink} target="_blank" rel="noopener noreferrer">
              Ver en Instagram
            </a>
            {video.notePath && <Link href={video.notePath}>Leé la noticia</Link>}
            {video.credit?.href && (
              <a href={video.credit.href} target="_blank" rel="noopener noreferrer">
                Video original en {video.credit.label}
              </a>
            )}
          </p>
          <p className="video-dialog-privacy">El reproductor es de Instagram (Meta) y se carga solo cuando abrís un video.</p>
        </OverlayDialog>
      )}
    </article>
  );
}
