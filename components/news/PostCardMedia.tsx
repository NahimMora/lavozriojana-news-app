'use client';

import { useState } from 'react';
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
 * dejar un recuadro vacío. */
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

  if (!post.mainImageUrl || failed) {
    return <CategoryFallback slug={post.category.slug} name={post.category.name} />;
  }

  return (
    <Image
      src={post.mainImageUrl}
      alt={post.mainImageAlt || post.title}
      fill
      sizes={sizes}
      priority={priority}
      style={{ objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  );
}
