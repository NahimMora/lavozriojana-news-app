'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const EMBED_SCRIPT = 'https://www.instagram.com/embed.js';
const EMBED_TIMEOUT_MS = 8000;
let scriptPromise: Promise<void> | null = null;

/** Instagram's official embed script, requested once per page and only on demand. */
function loadEmbedScript() {
  if (window.instgrm) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = EMBED_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error('instagram embed.js'));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Official Instagram embed (blockquote + embed.js), mounted only when the
 * reader opens a video. embed.js replaces the blockquote with an iframe, so
 * it lives in a node React does not manage. If no iframe appears, or the
 * script cannot load (blocked, or a post that does not allow embedding),
 * the reader gets the link to Instagram instead.
 */
export function InstagramEmbed({ permalink, title }: { permalink: string; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const quote = document.createElement('blockquote');
    quote.className = 'instagram-media';
    quote.setAttribute('data-instgrm-permalink', permalink);
    quote.setAttribute('data-instgrm-version', '14');
    const link = document.createElement('a');
    link.href = permalink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `Ver en Instagram: ${title}`;
    quote.appendChild(link);
    host.replaceChildren(quote);

    const observer = new MutationObserver(() => {
      if (host.querySelector('iframe')) {
        setState('ready');
        observer.disconnect();
      }
    });
    observer.observe(host, { childList: true, subtree: true });

    loadEmbedScript()
      .then(() => {
        if (cancelled) return;
        window.instgrm?.Embeds.process();
        timer = setTimeout(() => {
          if (!cancelled && !host.querySelector('iframe')) setState('failed');
        }, EMBED_TIMEOUT_MS);
      })
      .catch(() => {
        if (!cancelled) setState('failed');
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      observer.disconnect();
      host.replaceChildren();
    };
  }, [permalink, title]);

  return (
    <div className={`instagram-embed is-${state}`}>
      <div className="instagram-embed-host" ref={hostRef} hidden={state === 'failed'} />
      {state === 'loading' && (
        <p className="instagram-embed-status" role="status">
          Cargando el reproductor de Instagram…
        </p>
      )}
      {state === 'failed' && (
        <p className="instagram-embed-status" role="status">
          No se pudo mostrar el video en esta página.{' '}
          <a href={permalink} target="_blank" rel="noopener noreferrer">
            Miralo en Instagram
          </a>
          .
        </p>
      )}
    </div>
  );
}
