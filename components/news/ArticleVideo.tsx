'use client';

import { useEffect, useRef, useState } from 'react';

export function ArticleVideo({ url, poster }: { url: string; poster?: string | null }) {
  const [ratio, setRatio] = useState(16 / 9);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateRatio = () => {
      if (video.videoWidth && video.videoHeight) setRatio(video.videoWidth / video.videoHeight);
    };
    // Cached metadata can arrive before hydration attaches React handlers.
    updateRatio();
    video.addEventListener('loadedmetadata', updateRatio);
    return () => video.removeEventListener('loadedmetadata', updateRatio);
  }, [url]);
  return (
    <div className="article-video-wrap" style={{ aspectRatio: ratio, maxWidth: `min(100%, ${80 * ratio}svh)` }}>
      <video key={url} ref={videoRef} className="article-video" aria-label="Video de la noticia" controls playsInline preload="metadata" poster={poster || undefined}>
        <source src={url} type="video/mp4" />
      </video>
    </div>
  );
}
