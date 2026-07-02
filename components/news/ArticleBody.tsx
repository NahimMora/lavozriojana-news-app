import { sanitizeArticleHtml } from '@/lib/sanitize';

export function ArticleBody({ html }: { html: string | null | undefined }) {
  const cleanHtml = sanitizeArticleHtml(html || '');
  if (!cleanHtml.trim()) return null;

  return <div className="lr-article" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}

export function ArticleLead({ html, fallback }: { html: string | null | undefined; fallback?: string }) {
  if (html) {
    return (
      <div
        className="article-lead article-lead-html"
        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(html) }}
      />
    );
  }

  if (!fallback) return null;
  return <p className="article-lead">{fallback}</p>;
}
