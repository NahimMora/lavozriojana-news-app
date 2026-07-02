import Link from 'next/link';
import Image from 'next/image';
import { BannerAd } from '@/components/news/BannerAd';
import { BreakingNewsBar } from '@/components/news/BreakingNewsBar';
import { MostRead } from '@/components/news/MostRead';
import { PostCard } from '@/components/news/PostCard';
import { getHomeData } from '@/lib/posts';
import type { PublicPost } from '@/lib/posts';

export const runtime = 'nodejs';
export const revalidate = 60;

function CategorySection({
  block,
  embedded = false
}: {
  block: Awaited<ReturnType<typeof getHomeData>>['categoryBlocks'][0];
  embedded?: boolean;
}) {
  const { category, posts } = block;

  const body =
    posts.length === 1 ? (
      <PostCard post={posts[0]} variant="horizontal" />
    ) : posts.length === 2 ? (
      <div className="editorial-2col">
        <PostCard post={posts[0]} variant="featured" />
        <PostCard post={posts[1]} variant="compact" />
      </div>
    ) : (
      <div className="editorial-grid">
        {posts.slice(0, 3).map((post) => (
          <PostCard post={post} key={post.id} />
        ))}
      </div>
    );

  const inner = (
    <>
      <div className="cat-block-head">
        <h2 className="section-title">{category.name}</h2>
        <Link href={`/categoria/${category.slug}`} className="cat-block-more">
          Ver más →
        </Link>
      </div>
      {body}
    </>
  );

  return (
    <div className="cat-block">
      {embedded ? inner : <div className="container">{inner}</div>}
    </div>
  );
}

function LoUltimoSlice({ posts }: { posts: PublicPost[] }) {
  if (posts.length < 3) return null;
  return (
    <div className="cat-block">
      <div className="container">
        <div className="cat-block-head">
          <h2 className="section-title blue" style={{ whiteSpace: 'nowrap' }}>Titulares del día</h2>
        </div>
        <div className="lo-ultimo-list">
          {posts.slice(0, 6).map((post) => (
            <div className="lo-ultimo-item" key={post.id}>
              <Link className="lo-kicker" href={`/categoria/${post.category.slug}`}>
                {post.category.name}
              </Link>
              <Link className="lo-title" href={`/noticias/${post.slug}`}>
                {post.title}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnFocoSlice({ posts }: { posts: PublicPost[] }) {
  if (posts.length < 2) return null;
  const [main, ...rest] = posts;
  return (
    <div className="cat-block">
      <div className="container">
        <div className="cat-block-head">
          <h2 className="section-title">En foco</h2>
        </div>
        <div className="en-foco-layout">
          <PostCard post={main} variant="overlay" />
          <div className="en-foco-sidebar">
            {rest.slice(0, 4).map((post) => (
              <div className="en-foco-item" key={post.id}>
                <Link className="kicker" href={`/categoria/${post.category.slug}`}>
                  {post.category.name}
                </Link>
                <h3 className="post-title">
                  <Link href={`/noticias/${post.slug}`}>{post.title}</Link>
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getHomeData>> = {
    categories: [],
    breaking: [],
    featured: [],
    latest: [],
    mostRead: [],
    categoryBlocks: []
  };

  try {
    data = await getHomeData();
  } catch {
    /* base de datos vacía o inicio en frío */
  }

  /* ── Pool management: cada post se usa una sola vez ─── */
  type PostId = (typeof data.latest)[0]['id'];
  const seen = new Set<PostId>();

  const mainPost = data.featured[0] || data.latest[0];
  if (mainPost) seen.add(mainPost.id);

  /* Pool deduplicado de featured + latest */
  const heroPool: typeof data.latest = [];
  for (const p of [...data.featured, ...data.latest]) {
    if (!seen.has(p.id)) heroPool.push(p);
  }

  /* Posiciones del hero */
  const subCards  = heroPool.slice(0, 2);
  const featured1 = heroPool[2];
  const listItems = heroPool.slice(3, 12); /* AHORA: hasta 9 items */

  /* Marcar como vistos */
  for (const p of [...subCards, ...(featured1 ? [featured1] : []), ...listItems]) {
    seen.add(p.id);
  }

  /* Featured disponibles para el sidebar (antes de consumir latest) */
  const featuredForSidebar = data.featured.filter((p) => !seen.has(p.id));

  /* Últimas noticias (sección principal) */
  const latestPosts = data.latest.filter((p) => !seen.has(p.id)).slice(0, 9);
  latestPosts.forEach((p) => seen.add(p.id));

  /* Sidebar: featured sobrantes + latest no usados en la grilla, hasta 10 */
  const sidebarHighlights = [
    ...featuredForSidebar,
    ...data.latest.filter((p) => !seen.has(p.id)),
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 10);

  /* "Lo último" — pool de titulares compact */
  const loUltimoPool = data.latest.filter((p) => !seen.has(p.id)).slice(0, 6);
  loUltimoPool.forEach((p) => seen.add(p.id));

  /* "En foco" — nota grande + listado */
  const enFocoPool = [
    ...data.featured.filter((p) => !seen.has(p.id)),
    ...data.latest.filter((p) => !seen.has(p.id)),
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 5);

  /* Category blocks con posts */
  const catBlocks = data.categoryBlocks.filter((b) => b.posts.length > 0);

  return (
    <>
      <BreakingNewsBar posts={data.breaking} />
      <h1 className="sr-only">La Voz Riojana</h1>

      {/* ── Hero editorial ─────────────────────────────────── */}
      <section style={{ padding: '18px 0 0' }}>
        <div className="container">
          {mainPost ? (
            <div className="home-hero-grid">
              {/* IZQUIERDA: nota principal + 2 sub-cards */}
              <div className="hero-left">
                <div className="hero-main-slot">
                  <PostCard post={mainPost} variant="overlay" priority />
                </div>

                {subCards.length > 0 && (
                  <div className="hero-sub-row">
                    {subCards.map((post) => (
                      <div className="hero-sub-card" key={post.id}>
                        <PostCard post={post} variant="overlay" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DERECHA: nota destacada + bloque AHORA */}
              <div className="hero-right">
                {featured1 && (
                  <div className="hero-right-item">
                    <PostCard post={featured1} variant="overlay" />
                  </div>
                )}

                {listItems.length > 0 && (
                  <div className="hero-right-item">
                    <div className="ahora-header">
                      <span className="live-label">Ahora</span>
                    </div>
                    <div className="latest-list">
                      {listItems.map((post) => (
                        <PostCard post={post} variant="list" key={post.id} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <p className="muted">No hay noticias publicadas todavía.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Últimas noticias + sidebar ──────────────────────── */}
      {latestPosts.length > 0 && (
        <section className="section topline" style={{ marginTop: 22 }}>
          <div className="container news-layout">
            <div>
              <h2 className="section-title">Últimas noticias</h2>
              <div className="editorial-grid">
                {latestPosts.map((post) => (
                  <PostCard post={post} key={post.id} />
                ))}
              </div>
              <BannerAd slot="HOME_MIDDLE" />
            </div>

            <aside className="sidebar" aria-label="Lateral">
              {sidebarHighlights.length > 0 && (
                <section className="sidebar-highlights">
                  <h2 className="section-title blue">Destacados</h2>
                  <div className="sidebar-hi-list">
                    {sidebarHighlights.map((post) => (
                      <article key={post.id} className="sidebar-hi-item">
                        <div className="sidebar-hi-text">
                          <Link className="kicker" href={`/categoria/${post.category.slug}`}>
                            {post.category.name}
                          </Link>
                          <h3 className="sidebar-hi-title">
                            <Link href={`/noticias/${post.slug}`}>{post.title}</Link>
                          </h3>
                        </div>
                        {post.mainImageUrl && (
                          <Link href={`/noticias/${post.slug}`} className="sidebar-hi-thumb">
                            <Image src={post.mainImageUrl} alt="" fill sizes="62px" />
                          </Link>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className="sidebar-social">
                <h2 className="section-title">Seguinos</h2>
                <div className="sidebar-social-links">
                  <a href="https://facebook.com/lavozriojana" target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    Facebook
                  </a>
                  <a href="https://instagram.com/lavozriojana" target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>
                    Instagram
                  </a>
                </div>
              </section>

              <BannerAd slot="SIDEBAR" />
            </aside>
          </div>
        </section>
      )}

      {/* ── Bloques por categoría + slices intercaladas ──────── */}
      {catBlocks.map((block, idx) => {
        /* cat[6] se renderiza dentro del bloque combinado con el ranking */
        if (idx === 6 && catBlocks.length > 6) return null;

        /* idx 5: layout combinado — 2 categorías a la izq, ranking a la der */
        if (idx === 5) {
          const cat6 = catBlocks[6];
          return (
            <div key="cats-ranking" className="cats-rank-wrap">
              <div className="container">
                <div className="cats-rank-grid">
                  <div className="cats-rank-left">
                    <CategorySection block={block} embedded />
                    {cat6 && <CategorySection block={cat6} embedded />}
                  </div>
                  <div className="cats-rank-right">
                    <MostRead posts={data.mostRead} />
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const nodes: React.ReactNode[] = [
          <CategorySection key={block.category.id} block={block} />
        ];
        if (idx === 1) nodes.push(<LoUltimoSlice key="lo-ultimo" posts={loUltimoPool} />);
        if (idx === 3) nodes.push(<EnFocoSlice   key="en-foco"   posts={enFocoPool} />);
        if (idx === 8) nodes.push(
          <div key="newsletter" className="newsletter-block">
            <div className="container newsletter-inner">
              <span className="newsletter-eyebrow">La Voz Riojana</span>
              <h2 className="newsletter-title">Recibí las noticias de La Rioja por WhatsApp</h2>
              <p className="newsletter-sub">Sumate a nuestro grupo y enterate de todo lo que pasa en la provincia al instante.</p>
              <a
                href="https://wa.me/5493804000000?text=Hola%2C%20quiero%20recibir%20las%20noticias%20de%20La%20Voz%20Riojana"
                target="_blank"
                rel="noopener noreferrer"
                className="newsletter-wa-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Sumarme al grupo de WhatsApp
              </a>
              <p className="newsletter-legal">Número: +54 9 380 400-0000 · Solo enviamos contenido de La Voz Riojana.</p>
            </div>
          </div>
        );
        return nodes;
      })}
    </>
  );
}
