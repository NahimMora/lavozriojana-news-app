import Link from 'next/link';
import { getCategoriesSafe } from '@/lib/posts';
import { INITIAL_CATEGORIES } from '@/lib/site';
import { slugify } from '@/lib/slug';

export default async function NotFound() {
  const dbCategories = await getCategoriesSafe();
  const categories =
    dbCategories.length > 0
      ? dbCategories.map((c) => ({ name: c.name, slug: c.slug }))
      : INITIAL_CATEGORIES.map((name) => ({ name, slug: slugify(name, 'categoria') }));

  return (
    <div className="container section" style={{ textAlign: 'center', padding: '48px 16px 60px' }}>
      <p className="kicker" style={{ display: 'inline-block' }}>Error 404</p>
      <h1 className="article-title" style={{ marginTop: 6 }}>Página no encontrada</h1>
      <p className="article-lead" style={{ margin: '0 auto 22px', maxWidth: 480 }}>
        La página que buscás no existe, fue movida o la URL tiene un error. Podés buscar la noticia o volver a la
        portada.
      </p>

      <form className="search-form-lg" action="/buscar" role="search" style={{ maxWidth: 480, margin: '0 auto 26px' }}>
        <input type="search" name="q" placeholder="Buscar noticias…" aria-label="Buscar noticias" autoFocus />
        <button type="submit">Buscar</button>
      </form>

      <div style={{ marginBottom: 26 }}>
        <Link className="button" href="/">
          Volver a la portada
        </Link>
      </div>

      <div className="search-suggestions">
        <p>Secciones</p>
        <div className="search-tags">
          {categories.slice(0, 8).map((cat) => (
            <Link href={`/categoria/${cat.slug}`} className="search-tag" key={cat.slug}>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
