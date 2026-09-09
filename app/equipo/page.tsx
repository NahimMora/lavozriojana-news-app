import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { authorInitials, authorProfileUrl } from '@/lib/author';
import { getActiveAuthorsSafe } from '@/lib/posts';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Equipo';
  const description = 'Conocé al equipo editorial de La Voz Riojana y las firmas responsables de cada sección.';
  const url = absoluteUrl('/equipo');

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, siteName: SITE_NAME, title, description },
    twitter: { card: 'summary', title, description }
  };
}

export default async function TeamPage() {
  const authors = await getActiveAuthorsSafe();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Equipo', item: absoluteUrl('/equipo') }
    ]
  };

  return (
    <div className="container section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Breadcrumbs items={[{ label: 'Equipo' }]} />

      <header className="article-header" style={{ margin: 0 }}>
        <h1 className="article-title">Equipo</h1>
        <p className="article-lead">
          La Voz Riojana organiza su cobertura por secciones editoriales. Actualmente, Fernando Nahim Mora conduce
          la cobertura de todas las secciones del medio; a medida que se sumen más periodistas, sus perfiles se
          agregarán a esta página.
        </p>
      </header>

      {authors.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          Todavía no hay firmas activas cargadas.
        </p>
      ) : (
        <div className="team-grid">
          {authors.map((author) => (
            <Link href={authorProfileUrl(author.slug)} className="team-card" key={author.id}>
              <div className="author-box-avatar">
                {author.avatarUrl ? (
                  <Image src={author.avatarUrl} alt="" width={56} height={56} sizes="56px" />
                ) : (
                  <span className="author-box-initials">{authorInitials(author.name)}</span>
                )}
              </div>
              <div>
                <p className="team-card-name">{author.name}</p>
                {author.role && <p className="team-card-role">{author.role}</p>}
                {author.specialty && <p className="muted">{author.specialty}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
