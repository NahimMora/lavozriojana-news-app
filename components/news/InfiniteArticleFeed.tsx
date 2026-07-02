'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { splitFirstArticleParagraph } from '@/lib/article-html';

/* ── Types ─────────────────────────────────────────────── */
interface RelatedPost {
  slug: string;
  title: string;
  mainImageUrl: string | null;
  publishedAt: string | null;
  category: { name: string; slug: string };
}

interface InlinePost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string | null;
  mainImageUrl: string | null;
  mainImageAlt: string | null;
  publishedAt: string | null;
  updatedAt: string;
  author: { name: string };
  category: { name: string; slug: string };
  tags?: Array<{ tag: { name: string; slug: string } }>;
  relatedPosts?: RelatedPost[];
}

/* ── Helpers ────────────────────────────────────────────── */
function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeZone: 'America/Argentina/La_Rioja'
  }).format(new Date(iso));
}

/* ── Skeleton ───────────────────────────────────────────── */
function ArticleSkeleton() {
  return (
    <div className="inline-article-skeleton" aria-hidden="true">
      <div className="skeleton-line" style={{ width: '30%', height: 12 }} />
      <div className="skeleton-line" style={{ width: '80%', height: 28, marginTop: 10 }} />
      <div className="skeleton-line" style={{ width: '60%', height: 28, marginTop: 6 }} />
      <div className="skeleton-block" style={{ height: 300, marginTop: 18 }} />
      <div className="skeleton-line" style={{ marginTop: 20 }} />
      <div className="skeleton-line" style={{ marginTop: 8 }} />
      <div className="skeleton-line" style={{ width: '70%', marginTop: 8 }} />
    </div>
  );
}

/* ── Related posts slice ────────────────────────────────── */
function InlineRelated({ posts, categoryName }: { posts: RelatedPost[]; categoryName: string }) {
  if (posts.length === 0) return null;
  return (
    <div className="inline-related">
      <p className="inline-related-head">Seguís leyendo · <span>{categoryName}</span></p>
      <div className="sidebar-hi-list" style={{ marginTop: 10 }}>
        {posts.map((p) => (
          <article key={p.slug} className="sidebar-hi-item">
            <div className="sidebar-hi-text">
              <Link className="kicker" href={`/categoria/${p.category.slug}`}>
                {p.category.name}
              </Link>
              <h3 className="sidebar-hi-title">
                <Link href={`/noticias/${p.slug}`}>{p.title}</Link>
              </h3>
              {p.publishedAt && (
                <time className="inline-rel-date">{formatDate(p.publishedAt)}</time>
              )}
            </div>
            {p.mainImageUrl && (
              <Link href={`/noticias/${p.slug}`} className="sidebar-hi-thumb">
                <Image src={p.mainImageUrl} alt="" fill sizes="62px" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

/* ── Inline article ─────────────────────────────────────── */
function InlineArticle({ post, onVisible }: { post: InlinePost; onVisible: (slug: string) => void }) {
  const headRef = useRef<HTMLElement>(null);
  const articleParts = splitFirstArticleParagraph(post.contentHtml);
  const articleTags = (post.tags || [])
    .map((item) => item.tag)
    .filter((tag, index, tags) => {
      const name = tag.name.trim();
      if (!name) return false;

      const normalized = name.toLowerCase();
      const categoryName = post.category.name.trim().toLowerCase();
      return normalized !== categoryName && tags.findIndex((item) => item.name.trim().toLowerCase() === normalized) === index;
    })
    .slice(0, 6);

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible(post.slug);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [post.slug, onVisible]);

  return (
    <article id={`infinite-${post.slug}`} className="inline-article">
      {/* Separator */}
      <div className="inline-separator" aria-label="Siguiente noticia">
        <span className="inline-sep-label">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="5" r="5" />
          </svg>
          Seguís leyendo
        </span>
        <div className="inline-sep-line" />
      </div>

      {/* Grid: artículo izq · related der */}
      <div className="inline-article-grid">
        <div>
          {/* Header */}
          <header className="article-header" ref={headRef}>
            <div className="article-topic-row" aria-label="Temas de la noticia">
              <Link className="article-topic-chip article-topic-chip-primary" href={`/categoria/${post.category.slug}`}>
                {post.category.name}
              </Link>
              {articleTags.map((tag) => (
                <Link className="article-topic-chip" href={`/buscar?q=${encodeURIComponent(tag.name)}`} key={tag.slug}>
                  {tag.name}
                </Link>
              ))}
            </div>
            <h2 className="article-title" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.8rem)' }}>
              <Link href={`/noticias/${post.slug}`}>{post.title}</Link>
            </h2>
            {articleParts.firstParagraphHtml ? (
              <div
                className="article-lead article-lead-html"
                dangerouslySetInnerHTML={{ __html: articleParts.firstParagraphHtml }}
              />
            ) : (
              post.excerpt && <p className="article-lead">{post.excerpt}</p>
            )}
            <div className="article-byline">
              <span className="article-byline-author">Por {post.author.name}</span>
              <span className="article-byline-sep">·</span>
              <time className="article-byline-meta" dateTime={post.publishedAt ?? undefined}>
                {formatDate(post.publishedAt)}
              </time>
              <span className="article-byline-sep">·</span>
              <Link
                href={`/noticias/${post.slug}`}
                className="article-byline-meta"
                style={{ color: 'var(--blue)' }}
              >
                Ir a la nota →
              </Link>
            </div>
          </header>

          {/* Image or fallback */}
          <figure className="article-figure">
            {post.mainImageUrl ? (
              <Image
                src={post.mainImageUrl}
                alt={post.mainImageAlt || post.title}
                width={1200}
                height={675}
                sizes="(min-width: 980px) 760px, 100vw"
              />
            ) : (
              <div className={`article-image-fallback category-fallback category-${post.category.slug}`}>
                <span className="cf-badge">{post.category.name}</span>
                <span className="cf-brand">La Voz Riojana</span>
              </div>
            )}
          </figure>

          {/* Body */}
          {articleParts.restHtml && (
            <div
              className="lr-article"
              dangerouslySetInnerHTML={{ __html: articleParts.restHtml }}
            />
          )}
        </div>

        {/* Sidebar: related posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <aside className="inline-article-aside">
            <InlineRelated posts={post.relatedPosts} categoryName={post.category.name} />
          </aside>
        )}
      </div>
    </article>
  );
}

/* ── Main component ─────────────────────────────────────── */
export function InfiniteArticleFeed({ initialSlug }: { initialSlug: string }) {
  const [posts, setPosts] = useState<InlinePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const seenSlugs = useRef(new Set([initialSlug]));
  const triggerRef = useRef<HTMLDivElement>(null);
  const lastSlugRef = useRef(initialSlug);
  const loadingRef = useRef(false);
  const doneRef = useRef(false);

  const loadNext = useCallback(async () => {
    if (loadingRef.current || doneRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const exclude = [...seenSlugs.current].join(',');
      const res = await fetch(
        `/api/posts/next?slug=${encodeURIComponent(lastSlugRef.current)}&exclude=${encodeURIComponent(exclude)}`
      );

      if (res.status === 204 || !res.ok) {
        doneRef.current = true;
        setDone(true);
        return;
      }

      const post: InlinePost = await res.json();

      if (!post?.slug || seenSlugs.current.has(post.slug)) {
        doneRef.current = true;
        setDone(true);
        return;
      }

      seenSlugs.current.add(post.slug);
      lastSlugRef.current = post.slug;
      setPosts((prev) => [...prev, post]);
    } catch {
      doneRef.current = true;
      setDone(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  /* Observe trigger element */
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNext();
      },
      { rootMargin: '400px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [loadNext]);

  /* Update browser URL when article comes into view */
  const handleVisible = useCallback((slug: string) => {
    const newUrl = `/noticias/${slug}`;
    if (window.location.pathname !== newUrl) {
      window.history.pushState({ slug }, '', newUrl);
    }
  }, []);

  return (
    <div className="infinite-feed">
      {posts.map((post) => (
        <InlineArticle key={post.slug} post={post} onVisible={handleVisible} />
      ))}

      {loading && <ArticleSkeleton />}

      {done && posts.length > 0 && (
        <div className="infinite-done">
          <span>No hay más noticias por ahora.</span>
          <Link href="/" className="infinite-done-link">Volver al inicio</Link>
        </div>
      )}

      {/* Trigger: always present, triggers load when visible */}
      {!done && <div ref={triggerRef} style={{ height: 1 }} aria-hidden="true" />}
    </div>
  );
}
