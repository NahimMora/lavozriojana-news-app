import Link from 'next/link';
import Image from 'next/image';
import { AdSenseUnit } from '@/components/news/AdSenseUnit';
import { AhoraMore } from '@/components/news/AhoraMore';
import { BannerSquare } from '@/components/news/BannerAd';
import { BreakingNewsBar } from '@/components/news/BreakingNewsBar';
import { ServicesSummary } from '@/components/feed/ServicesSummary';
import { HomeRankings } from '@/components/feed/HomeRankings';
import { VideosBand } from '@/components/feed/VideosBand';
import { PostCard } from '@/components/news/PostCard';
import { getHomeData } from '@/lib/posts';
import type { PublicPost } from '@/lib/posts';
import { getActiveBanner } from '@/lib/banners';
import { getUrgentStory } from '@/lib/feed';
import { formatHeadline } from '@/lib/headline';
import { FACEBOOK_URL, INSTAGRAM_URL, WHATSAPP_NEWS_URL, WHATSAPP_NUMBER_DISPLAY } from '@/lib/site';
import { SiteNotices } from '@/components/feed/SiteNotices';
import { ServiceCards } from '@/components/services/ServiceCards';

const headlineOf = (post: PublicPost) => formatHeadline(post.title, post.excerpt, post.contentText);
/* Mobile shows the first entries of "Ahora"; the rest unfold in place. */
const AHORA_MOBILE_VISIBLE = 5;
/* Cell of the latest grid the middle ad takes: end of the second row. */
const MIDDLE_AD_CELL = 5;

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
  /* Full-width blocks show the four fetched notes in one row; next to the
     ranking (embedded) the row is narrower and keeps three. */
  const shown = posts.slice(0, embedded ? 3 : 4);
  /* On phones the first note keeps its photo; the rest become rows. */
  const leadSizes = '(min-width: 1024px) 420px, (min-width: 560px) 47vw, 100vw';

  const body =
    shown.length === 1 ? (
      <PostCard post={shown[0]} variant="horizontal" autoplayInView />
    ) : shown.length === 2 ? (
      <div className="editorial-pair">
        {shown.map((post) => (
          <PostCard post={post} variant="horizontal" key={post.id} autoplayInView />
        ))}
      </div>
    ) : (
      <div className={`editorial-grid lead-first${shown.length === 4 ? ' cols-4' : ''}`}>
        {shown.map((post, i) => (
          <PostCard post={post} key={post.id} imageSizes={i === 0 ? leadSizes : undefined} autoplayInView />
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
    <div className="cat-block cat-section">
      {embedded ? inner : <div className="container">{inner}</div>}
    </div>
  );
}

function LoUltimoSlice({ posts }: { posts: PublicPost[] }) {
  if (posts.length < 3) return null;
  return (
    <div className="cat-block lo-ultimo-block">
      <div className="container">
        <div className="cat-block-head">
          <h2 className="section-title blue">Titulares del día</h2>
        </div>
        <div className="lo-ultimo-list">
          {posts.slice(0, 8).map((post) => (
            <article className="lo-ultimo-item" key={post.id}>
              <Link className="lo-kicker" href={`/categoria/${post.category.slug}`}>
                {post.category.name}
              </Link>
              <h3 className="lo-title">
                <Link href={`/noticias/${post.slug}`}>{headlineOf(post)}</Link>
              </h3>
            </article>
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
    <div className="cat-block en-foco-block">
      <div className="container">
        <div className="cat-block-head">
          <h2 className="section-title">En foco</h2>
        </div>
        <div className="en-foco-layout">
          <PostCard post={main} variant="horizontal" imageSizes="(min-width: 1024px) 400px, (min-width: 768px) 45vw, 100vw" autoplayInView />
          <div className="en-foco-sidebar">
            {rest.slice(0, 4).map((post) => (
              <article className="en-foco-item" key={post.id}>
                <Link className="kicker" href={`/categoria/${post.category.slug}`}>
                  {post.category.name}
                </Link>
                <h3 className="en-foco-title">
                  <Link href={`/noticias/${post.slug}`}>{headlineOf(post)}</Link>
                </h3>
              </article>
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

  /* Square ads that change the layout around them: the middle one takes the
     place of a card in the latest grid and the sidebar one shortens
     Destacados, so the page needs to know beforehand whether they are filled.
     Fetched in parallel with the home data. */
  const bannersPromise = Promise.all([
    getActiveBanner('HOME_MIDDLE').catch(() => null),
    getActiveBanner('SIDEBAR').catch(() => null)
  ]);
  /* Urgent story of ultimo-momento.json, pinned in the ticker (shared with
     the layout's notices through React cache). */
  const urgentPromise = getUrgentStory().catch(() => null);
  try {
    data = await getHomeData();
  } catch {
    /* base de datos vacía o inicio en frío */
  }
  const [[middleBanner, sideBanner], urgentStory] = await Promise.all([bannersPromise, urgentPromise]);

  /* ── Pool management: cada post se usa una sola vez ─── */
  type PostId = (typeof data.latest)[0]['id'];
  const seen = new Set<PostId>();

  const mainPost = data.featured[0] || data.latest[0];
  if (mainPost) seen.add(mainPost.id);

  /* Pool deduplicado de featured + latest */
  const heroPool: typeof data.latest = [];
  const heroPoolSeen = new Set(seen);
  for (const p of [...data.featured, ...data.latest]) {
    if (!heroPoolSeen.has(p.id)) {
      heroPool.push(p);
      heroPoolSeen.add(p.id);
    }
  }

  /* Posiciones del hero: principal | 1 destacada + 2 compactas | Ahora */
  const secondary = heroPool.slice(0, 3);
  const listItems = heroPool.slice(3, 12); /* AHORA: hasta 9 items */

  /* Marcar como vistos */
  for (const p of [...secondary, ...listItems]) {
    seen.add(p.id);
  }

  /* Featured disponibles para el sidebar (antes de consumir latest) */
  const featuredForSidebar = data.featured.filter((p) => !seen.has(p.id));

  /* Últimas noticias (sección principal): 1 featured + 4 compact, que
     igualan su alto, + 9 celdas en grilla de 3 columnas (filas completas):
     9 notas, u 8 y la publicidad cuadrada cuando HOME_MIDDLE está activa. */
  const latestPosts = data.latest.filter((p) => !seen.has(p.id)).slice(0, middleBanner?.imageUrl ? 13 : 14);
  latestPosts.forEach((p) => seen.add(p.id));

  /* Destacados: featured sobrantes + latest sin usar. Se marcan como vistos
     para que "Titulares del día" y "En foco" no repitan las mismas notas.
     12 con la publicidad lateral activa y 14 sin ella, para que el lateral
     termine a la altura de la grilla. */
  const sidebarHighlights = [
    ...featuredForSidebar,
    ...data.latest.filter((p) => !seen.has(p.id)),
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, sideBanner?.imageUrl ? 12 : 14);
  sidebarHighlights.forEach((p) => seen.add(p.id));

  /* "Lo último" — pool de titulares compact */
  const loUltimoPool = data.latest.filter((p) => !seen.has(p.id)).slice(0, 8);
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

  const middleAd = <BannerSquare key="home-middle-ad" banner={middleBanner} slot="HOME_MIDDLE" className="grid-ad" />;

  return (
    <>
      {/* If the urgent story already leads the opening, pinning it again would
          repeat the same headline twice in the first screen. */}
      <BreakingNewsBar posts={data.breaking} pinned={urgentStory && urgentStory.slug !== mainPost?.slug ? urgentStory : null} />
      {/* Weather alert: only on the home page, below the ticker. */}
      <SiteNotices />
      <h1 className="sr-only">La Voz Riojana</h1>

      {/* ── Hero editorial ─────────────────────────────────── */}
      <section className="home-opening" aria-label="Noticias destacadas">
        <div className="container">
          {mainPost ? (
            /* Desktop: principal | secundarias | Ahora. Tablet: principal
               arriba y dos columnas debajo. Móvil: apilado (ver CSS). */
            <div className={`home-hero-grid${!secondary.length ? ' lead-only' : listItems.length ? '' : ' no-ahora'}`}>
              <div className="hero-lead">
                <PostCard post={mainPost} variant="lead" priority imageSizes="(min-width: 1200px) 600px, (min-width: 1024px) 640px, (min-width: 768px) 52vw, 100vw" autoplayInView />
              </div>

              {secondary.length > 0 && (
                <div className="hero-secondary">
                  {secondary.map((post, i) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      variant={i === 0 ? 'featured' : 'compact'}
                      imageSizes={i === 0 ? '(min-width: 1200px) 310px, (min-width: 768px) 40vw, 112px' : undefined}
                      autoplayInView
                    />
                  ))}
                </div>
              )}

              {listItems.length > 0 && (
                <section className="ahora-block" aria-labelledby="ahora-title">
                  <h2 className="ahora-header" id="ahora-title">
                    <span className="live-label">Ahora</span>
                  </h2>
                  <div className="latest-list" id="ahora-list">
                    {listItems.map((post) => (
                      <PostCard post={post} variant="list" key={post.id} />
                    ))}
                  </div>
                  {listItems.length > AHORA_MOBILE_VISIBLE && (
                    <AhoraMore count={listItems.length - AHORA_MOBILE_VISIBLE} listId="ahora-list" />
                  )}
                </section>
              )}
            </div>
          ) : (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <p className="muted">No hay noticias publicadas todavía.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Espacio publicitario (AdSense) ──────────────────── */}
      <div className="container">
        <AdSenseUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} className="ad-slot-home-top" />
      </div>

      {/* ── Servicios: una línea después de la apertura, no antes ── */}
      <ServicesSummary />

      {/* ── Videos: banda propia apenas pasada la apertura ───── */}
      <VideosBand knownPosts={data.latest} />

      {/* ── Últimas noticias + sidebar ──────────────────────── */}
      {latestPosts.length > 0 && (
        <section className="section topline home-latest">
          <div className="container news-layout">
            <div>
              <h2 className="section-title">Últimas noticias</h2>
              <div className="editorial-2col latest-lead">
                <PostCard post={latestPosts[0]} variant="featured" autoplayInView />
                {latestPosts.length > 1 && (
                  <div className="editorial-2col-list">
                    {latestPosts.slice(1, 5).map((post) => (
                      <PostCard post={post} variant="compact" key={post.id} autoplayInView />
                    ))}
                  </div>
                )}
              </div>
              {latestPosts.length > 5 ? (
                <div className="editorial-grid">
                  {latestPosts.slice(5).flatMap((post, i) => [
                    ...(i === MIDDLE_AD_CELL ? [middleAd] : []),
                    <PostCard post={post} key={post.id} autoplayInView />
                  ])}
                  {latestPosts.length - 5 <= MIDDLE_AD_CELL && middleAd}
                </div>
              ) : (
                middleAd
              )}
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
                            <Link href={`/noticias/${post.slug}`}>{headlineOf(post)}</Link>
                          </h3>
                        </div>
                        {post.mainImageUrl && (
                          <Link href={`/noticias/${post.slug}`} className="sidebar-hi-thumb" aria-hidden="true" tabIndex={-1}>
                            <Image src={post.mainImageUrl} alt="" fill sizes="(max-width: 767px) 168px, 72px" />
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
                  <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    Facebook
                  </a>
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>
                    Instagram
                  </a>
                </div>
              </section>

              <BannerSquare banner={sideBanner} slot="SIDEBAR" />
              <AdSenseUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_SIDEBAR} className="ad-slot-home-sidebar" />
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
                    <HomeRankings mostRead={data.mostRead} knownPosts={data.latest} />
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
        if (idx === 2) nodes.push(
          <div key="servicios" className="cat-block svc-band">
            <div className="container">
              <ServiceCards
                kinds={['clima', 'dolar', 'feriado', 'sismo', 'cortes', 'pagos']}
                limit={4}
                layout="row"
                title="Datos útiles"
              />
            </div>
          </div>
        );
        if (idx === 3) nodes.push(<EnFocoSlice   key="en-foco"   posts={enFocoPool} />);
        if (idx === 8) nodes.push(
          <div key="newsletter" className="newsletter-block">
            <div className="container newsletter-inner">
              <span className="newsletter-eyebrow">La Voz Riojana</span>
              <h2 className="newsletter-title">¿Pasó algo en tu barrio? Mandanos tu noticia</h2>
              <p className="newsletter-sub">Escribinos por WhatsApp con fotos, videos o datos de lo que está pasando en La Rioja. Nuestra redacción verifica cada aporte antes de publicarlo.</p>
              <a
                href={WHATSAPP_NEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="newsletter-wa-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar noticia por WhatsApp
              </a>
              <p className="newsletter-legal">WhatsApp oficial: {WHATSAPP_NUMBER_DISPLAY}</p>
            </div>
          </div>
        );
        return nodes;
      })}
      {catBlocks.length < 6 && data.mostRead.length > 0 && (
        <div className="container section topline"><HomeRankings mostRead={data.mostRead} knownPosts={data.latest} /></div>
      )}
    </>
  );
}
