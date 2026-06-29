import { absoluteUrl } from '@/lib/site';

export function ShareLinks({ title, path }: { title: string; path: string }) {
  const url = absoluteUrl(path);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="share-row" aria-label="Compartir noticia">
      <span className="muted" style={{ fontWeight: 800 }}>
        Compartir
      </span>
      <a className="share-button" href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <a className="share-button" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <a className="share-button" href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
        X
      </a>
    </div>
  );
}
