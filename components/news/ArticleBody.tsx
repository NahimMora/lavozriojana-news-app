import { sanitizeArticleHtml } from '@/lib/sanitize';

export function ArticleBody({ html }: { html: string }) {
  return <div className="lr-article" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(html) }} />;
}
