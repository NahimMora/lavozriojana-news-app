import { ArticleBody } from '@/components/news/ArticleBody';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { ContactForm } from '@/components/forms/ContactForm';
import { getStaticPage } from '@/lib/static-pages';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/site';

export async function InstitutionalPage({ slug }: { slug: string }) {
  const page = await getStaticPage(slug);
  if (!page) return null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: page.title, item: absoluteUrl(`/${slug}`) }
    ]
  };

  return (
    <div className="container section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Breadcrumbs items={[{ label: page.title }]} />
      <header className="article-header" style={{ margin: 0 }}>
        <h1 className="article-title">{page.title}</h1>
      </header>
      <ArticleBody html={page.contentHtml} />
      {slug === 'contacto' && <ContactForm />}
    </div>
  );
}
