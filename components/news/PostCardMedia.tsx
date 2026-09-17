'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { PublicPost } from '@/lib/posts';

export function CategoryFallback({ slug, name }: { slug: string; name: string }) {
  return (
    <span className={`category-fallback category-${slug}`}>
      <span className="cf-badge">{name}</span>
      <span className="cf-brand">La Voz Riojana</span>
    </span>
  );
}

/** Imagen de la card con fallback automático: si `mainImageUrl` falta o la
 * carga falla (404, host caído), muestra el degradé de categoría en vez de
 * dejar un recuadro vacío. Si la nota tiene video, pasar el mouse por
 * encima adelanta un avance mudo — solo en dispositivos con hover real
 * (mouse/trackpad), nunca autoplay en mobile para no gastar datos. */
export function CardImage({
  post,
  priority = false,
  sizes
}: {
  post: PublicPost;
  priority?: boolean;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!post.mainImageUrl || failed) {
    return <CategoryFallback slug={post.category.slug} name={post.category.name} />;
  }

  const handleEnter = () => {
    const video = videoRef.current;
    if (!video) return;
    /* preload="none" no dispara el algoritmo de seleccion de recurso hasta
       un load() explicito — sin esto, play() puede fallar con
       NotSupportedError en el primer hover. */
    if (video.readyState === 0) video.load();
    video.play().catch(() => {});
  };
  const handleLeave = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <div className="post-media-frame" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Image
        src={post.mainImageUrl}
        alt={post.mainImageAlt || post.title}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: 'cover' }}
        onError={() => setFailed(true)}
      />
      {post.videoUrl && (
        <video
          ref={videoRef}
          className="post-video-preview"
          src={post.videoUrl}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
