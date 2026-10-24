'use client';

import { useEffect, useRef, useState } from 'react';
import {
  IFRAME_DEFAULT_HEIGHT,
  IFRAME_TIMEOUT_MS,
  initialStage,
  nextStage,
  readEmbedMessage,
  type PlayerStage
} from '@/lib/instagram-player';

export const INSTAGRAM_PRIVACY_NOTE = 'El video se reproduce desde los servidores de Instagram (Meta) y se carga solo cuando lo reproducís.';

type Props = {
  title: string;
  permalink: string;
  embedUrl: string;
  videoUrl: string | null;
  poster: string | null;
};

/**
 * Mounted only after the reader asks to play, so nothing from Instagram
 * loads before that gesture.
 * 1. The Reel's signed mp4 in a native <video> (autoplay is allowed after
 *    the gesture; if the browser refuses, the controls remain).
 * 2. If there is no mp4 or it fails (an expired signature on a page left
 *    open), Instagram's official embed page in an iframe, sized by its own
 *    MEASURE messages.
 * 3. If Instagram never answers within 8 s, the link to the post.
 */
export function InstagramPlayer({ title, permalink, embedUrl, videoUrl, poster }: Props) {
  const [stage, setStage] = useState<PlayerStage>(() => initialStage(videoUrl));
  const [ratio, setRatio] = useState(9 / 16);
  const [height, setHeight] = useState(IFRAME_DEFAULT_HEIGHT);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (stage !== 'iframe') return;
    let answered = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = readEmbedMessage(event.origin, event.data);
      if (!message.fromInstagram) return;
      answered = true;
      if (message.height) setHeight(message.height);
    };
    window.addEventListener('message', onMessage);
    const timer = setTimeout(() => {
      if (!answered) setStage((current) => nextStage(current, 'iframe-timeout'));
    }, IFRAME_TIMEOUT_MS);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, [stage]);

  if (stage === 'video' && videoUrl) {
    return (
      // Width follows the video's proportion so that, capped at 80% of the
      // viewport height, the box keeps it: no black bars around the Reel.
      <div className="instagram-player is-video" style={{ aspectRatio: ratio, maxWidth: `min(100%, 420px, ${(80 * ratio).toFixed(2)}svh)` }}>
        <video
          src={videoUrl}
          poster={poster ?? undefined}
          controls
          playsInline
          autoPlay
          preload="metadata"
          aria-label={`Video: ${title}`}
          onLoadedMetadata={(event) => {
            const { videoWidth, videoHeight } = event.currentTarget;
            if (videoWidth && videoHeight) setRatio(videoWidth / videoHeight);
          }}
          onError={() => setStage((current) => nextStage(current, 'video-error'))}
        />
      </div>
    );
  }

  if (stage === 'iframe') {
    return (
      <div className="instagram-player is-iframe">
        <iframe
          ref={frameRef}
          src={embedUrl}
          title={`Video en Instagram: ${title}`}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ height }}
        />
      </div>
    );
  }

  return (
    <p className="instagram-player-status" role="status">
      No se pudo mostrar el video en esta página.{' '}
      <a href={permalink} target="_blank" rel="noopener noreferrer">
        Miralo en Instagram
      </a>
      .
    </p>
  );
}
