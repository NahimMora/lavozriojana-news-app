import type { Metadata } from 'next';
import type { Author } from '@prisma/client';
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
  const description = 'Conocé al equipo editorial de La Voz Riojana: responsable editorial, corresponsales por sección y firmas institucionales.';
  const url = absoluteUrl('/equipo');

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, siteName: SITE_NAME, title, description },
    twitter: { card: 'summary', title, description }
  };
}

function TeamCard({ author }: { author: Author }) {
  return (
    <Link href={authorProfileUrl(author.slug)} className="team-card">
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
  );
}

export default async function TeamPage() {
  const authors = await getActiveAuthorsSafe();

  const responsable = authors.filter((author) => !author.isInstitutional);
  const corresponsales = authors.filter((author) => author.isInstitutional && author.role === 'Corresponsal');
  const institucionales = authors.filter((author) => author.isInstitutional && author.role !== 'Corresponsal');

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
          La Voz Riojana organiza su cobertura por secciones editoriales, cada una con un/a corresponsal de
          referencia. La dirección periodística y la responsabilidad editorial del medio están a cargo de Fernando
          Nahim Mora.
        </p>
      </header>

      {authors.length === 0 && (
        <p className="muted" style={{ marginTop: 20 }}>
          Todavía no hay firmas activas cargadas.
        </p>
      )}

      {responsable.length > 0 && (
        <section className="section topline">
          <h2 className="section-title">Responsable editorial</h2>
          <div className="team-grid">
            {responsable.map((author) => (
              <TeamCard author={author} key={author.id} />
            ))}
          </div>
        </section>
      )}

      {corresponsales.length > 0 && (
        <section className="section topline">
          <h2 className="section-title">Corresponsales por sección</h2>
          <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
            Referentes asignados a cada sección. La cobertura efectiva de cada sección puede firmarse también con la
            firma institucional correspondiente mientras el equipo crece.
          </p>
          <div className="team-grid">
            {corresponsales.map((author) => (
              <TeamCard author={author} key={author.id} />
            ))}
          </div>
        </section>
      )}

      {institucionales.length > 0 && (
        <section className="section topline">
          <h2 className="section-title">Firmas institucionales</h2>
          <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
            Firma general de La Voz Riojana y firmas por sección utilizadas en la publicación automatizada de
            noticias.
          </p>
          <div className="team-grid">
            {institucionales.map((author) => (
              <TeamCard author={author} key={author.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
