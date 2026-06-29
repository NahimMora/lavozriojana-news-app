import { ArticleBody } from '@/components/news/ArticleBody';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { getStaticPage } from '@/lib/static-pages';

export async function InstitutionalPage({ slug }: { slug: string }) {
  const page = await getStaticPage(slug);
  if (!page) return null;

  return (
    <div className="container section">
      <Breadcrumbs items={[{ label: page.title }]} />
      <header className="article-header" style={{ margin: 0 }}>
        <h1 className="article-title">{page.title}</h1>
      </header>
      <ArticleBody html={page.contentHtml} />
      {slug === 'contacto' && (
        <form className="form-panel" style={{ maxWidth: 720, marginTop: 24 }}>
          <div className="form-row">
            <label style={{ flex: '1 1 220px' }}>
              Nombre
              <input name="name" />
            </label>
            <label style={{ flex: '1 1 220px' }}>
              Email
              <input name="email" type="email" />
            </label>
          </div>
          <label style={{ marginTop: 12 }}>
            Mensaje
            <textarea name="message" />
          </label>
          <p className="muted">Formulario preparado para conectar un servicio de contacto si se requiere.</p>
        </form>
      )}
    </div>
  );
}
