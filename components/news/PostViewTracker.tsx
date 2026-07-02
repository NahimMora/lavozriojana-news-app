'use client';

import { useEffect } from 'react';

export function PostViewTracker({ postId }: { postId: number }) {
  useEffect(() => {
    void fetch(`/api/posts/${postId}/view`, {
      method: 'POST',
      cache: 'no-store',
      keepalive: true
    }).catch(() => null);
  }, [postId]);

  return null;
}
