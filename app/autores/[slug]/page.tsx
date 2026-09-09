import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { Pagination } from '@/components/news/Pagination';
import { PostCard } from '@/components/news/PostCard';
import { authorInitials, authorProfileUrl, parseSocialLinks } from '@/lib/author';
import { getAuthorBySlug, getPostsByAuthor } from '@/lib/posts';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';
export const revalidate = 300;

type Props = {
  params: { slug: string };
  searchParams: { page?: string };
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  website: 'Sitio web'
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthorBySlug(params.slug);
  if (!author) return { title: 'Autor no encontrado' };

  const title = `${author.name} · Notas y perfil`;
  const description =
    author.bio?.slice(0, 300) ||
    `Notas publicadas por ${author.name} en La Voz Riojana${author.specialty ? `, especializado/a en ${author.specialty}` : ''}.`;
  const url = absoluteUrl(authorProfileUrl(author.slug));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'profile', url, siteName: SITE_NAME, title, description },
    twitter: { card: 'summary', title, description }
  };
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const author = await getAuthorBySlug(params.slug);
  if (!author) notFound();

  const page = Math.max(1, Number(searchParams.page || 1));
  const perPage = 12;
  const { posts, total } = await getPostsByAuthor(author.id, page, perPage);

  const socialLinks = parseSocialLinks(author.socialLinks);
  const profileUrl = absoluteUrl(authorProfileUrl(author.slug));

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Equipo', item: absoluteUrl('/equipo') },
      { '@type': 'ListItem', position: 3, name: author.name, item: profileUrl }
    ]
  };

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': author.isInstitutional ? 'Organization' : 'Person',
    name: author.name,
    url: profileUrl,
    ...(author.avatarUrl ? { image: author.avatarUrl } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.role ? { jobTitle: author.role } : {}),
    worksFor: { '@type': 'Organization', '@id': `${SITE_URL}#organization`, name: SITE_NAME },
    ...(socialLinks.length ? { sameAs: socialLinks.map((link) => link.url) } : {})
  };

  return (
    <div className="container section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <Breadcrumbs items={[{ label: 'Equipo', href: '/equipo' }, { label: author.name }]} />

      <header className="author-profile-header">
        <div className="author-box-avatar author-profile-avatar">
          {author.avatarUrl ? (
            <Image src={author.avatarUrl} alt="" width={88} height={88} sizes="88px" />
          ) : (
            <span className="author-box-initials">{authorInitials(author.name)}</span>
          )}
        </div>
        <div>
          <p className="author-box-kicker">{author.isInstitutional ? 'Firma institucional' : 'Autor/a'}</p>
          <h1 className="article-title" style={{ margin: '2px 0 4px' }}>{author.name}</h1>
          {author.role && <p className="author-box-role">{author.role}</p>}
          {author.specialty && <p className="muted">Especialidad: {author.specialty}</p>}
          {author.bio && <p className="author-box-bio" style={{ marginTop: 10 }}>{author.bio}</p>}
          <div className="author-box-links" style={{ marginTop: 10 }}>
            {author.email && <a href={`mailto:${author.email}`}>Contactar</a>}
            {socialLinks.map((link) => (
              <a href={link.url} key={link.platform} target="_blank" rel="noopener noreferrer">
                {SOCIAL_LABELS[link.platform] || link.platform}
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="section topline">
        <h2 className="section-title">Notas publicadas</h2>
        {posts.length === 0 ? (
          <p className="muted">Todavía no hay notas publicadas de esta firma.</p>
        ) : (
          <>
            <div className="editorial-grid">
              {posts.map((post) => (
                <PostCard post={post} key={post.id} />
              ))}
            </div>
            <Pagination page={page} perPage={perPage} total={total} basePath={authorProfileUrl(author.slug)} />
          </>
        )}
      </section>
    </div>
  );
}
