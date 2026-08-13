export function ArticleVideo({ url, poster }: { url: string; poster?: string | null }) {
  return (
    <div className="article-video-wrap">
      <video className="article-video" controls preload="metadata" poster={poster || undefined}>
        <source src={url} type="video/mp4" />
      </video>
    </div>
  );
}
