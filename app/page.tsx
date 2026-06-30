import { BannerAd } from '@/components/news/BannerAd';
import { BreakingNewsBar } from '@/components/news/BreakingNewsBar';
import { MostRead } from '@/components/news/MostRead';
import { PostCard } from '@/components/news/PostCard';
import { PhoneLeadForm } from '@/components/forms/PhoneLeadForm';
import { getHomeData } from '@/lib/posts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    data = {
      categories: [],
      breaking: [],
      featured: [],
      latest: [],
      mostRead: [],
      categoryBlocks: []
    };
  }

  const mainPost = data.featured[0] || data.latest[0];
  const heroSecondary = (data.featured.length > 1 ? data.featured.slice(1, 4) : data.latest.slice(1, 4)).filter(
    (post) => post.id !== mainPost?.id
  );
  const heroIds = new Set([mainPost?.id, ...heroSecondary.map((post) => post.id)].filter(Boolean));
  const livePosts = data.latest.filter((post) => !heroIds.has(post.id)).slice(0, 5);
  const latestPosts = data.latest.filter((post) => !heroIds.has(post.id)).slice(0, 9);

  return (
    <>
      <BreakingNewsBar posts={data.breaking} />
      <div className="container">
        <BannerAd slot="HOME_TOP" />
      </div>

      <section className="section">
        <div className="container home-hero-grid">
          {mainPost ? (
            <PostCard post={mainPost} variant="large" priority />
          ) : (
            <div className="form-panel">
              <h1 className="section-title">La Voz Riojana</h1>
              <p className="muted">Todavia no hay noticias publicadas. Ejecuta el seed o publica la primera nota por API.</p>
            </div>
          )}
          <div className="hero-secondary-column">
            {heroSecondary[0] && <PostCard post={heroSecondary[0]} key={heroSecondary[0].id} />}
            {heroSecondary.slice(1).map((post) => (
              <PostCard post={post} variant="compact" key={post.id} />
            ))}
          </div>
          <div className="live-column">
            <section className="latest-panel">
              <h2 className="section-title">Ahora</h2>
              <div className="latest-list">
                {livePosts.map((post) => (
                  <PostCard post={post} variant="compact" key={post.id} />
                ))}
              </div>
            </section>
            <MostRead posts={data.mostRead.slice(0, 5)} />
          </div>
        </div>
      </section>

      <section className="section topline">
        <div className="container news-layout">
          <div>
            <h2 className="section-title">Ultimas noticias</h2>
            <div className="editorial-grid">
              {latestPosts.map((post) => (
                <PostCard post={post} key={post.id} />
              ))}
            </div>
            <BannerAd slot="HOME_MIDDLE" />
          </div>
          <aside className="sidebar">
            <MostRead posts={data.mostRead} />
            <BannerAd slot="SIDEBAR" />
            <PhoneLeadForm source="home" />
          </aside>
        </div>
      </section>

      {data.categoryBlocks
        .filter((block) => block.posts.length > 0)
        .map((block) => (
          <section className="category-band" key={block.category.id}>
            <div className="container">
              <h2 className="section-title">{block.category.name}</h2>
              <div className="category-grid">
                {block.posts.map((post) => (
                  <PostCard post={post} variant="compact" key={post.id} />
                ))}
              </div>
            </div>
          </section>
        ))}
    </>
  );
}
