'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { PublicPost } from '@/lib/posts';

const PREVIEW_LOOP_SECONDS = 10;

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
 * dejar un recuadro vacío.
 *
 * Si la nota tiene video:
 * - `autoplayInView` (home): arranca solo al entrar en pantalla (mitad
 *   visible), sin necesidad de mouse — se corta a los primeros 10s en
 *   loop y se pausa al salir de vista. Nada de esto corre en el servidor
 *   ni afecta el HTML indexable: es un IntersectionObserver del lado del
 *   cliente, sin preload, que respeta ahorro de datos y "reducir
 *   movimiento" para no gastar recursos de mas.
 * - En el resto de los lugares (categoría, relacionadas), el avance sigue
 *   siendo solo con hover real (desktop), como antes. */
export function CardImage({
  post,
  priority = false,
  sizes,
  autoplayInView = false
}: {
  post: PublicPost;
  priority?: boolean;
  sizes: string;
  autoplayInView?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const startPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    /* preload="none" no dispara el algoritmo de seleccion de recurso hasta
       un load() explicito — sin esto, play() puede fallar con
       NotSupportedError la primera vez. */
    if (video.readyState === 0) video.load();
    video
      .play()
      .then(() => setPlaying(true))
      .catch(() => {});
  };

  const stopPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setPlaying(false);
  };

  useEffect(() => {
    if (!autoplayInView || !post.videoUrl) return;
    const frame = frameRef.current;
    if (!frame) return;

    const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (connection?.saveData || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startPlayback();
        else stopPlayback();
      },
      { threshold: 0.5 }
    );
    observer.observe(frame);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayInView, post.videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.currentTime >= PREVIEW_LOOP_SECONDS) video.currentTime = 0;
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, []);

  if (!post.mainImageUrl || failed) {
    return <CategoryFallback slug={post.category.slug} name={post.category.name} />;
  }

  return (
    <div
      className="post-media-frame"
      ref={frameRef}
      data-playing={playing || undefined}
      onMouseEnter={autoplayInView ? undefined : startPlayback}
      onMouseLeave={autoplayInView ? undefined : stopPlayback}
    >
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
          className={`post-video-preview${playing ? ' is-active' : ''}`}
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
