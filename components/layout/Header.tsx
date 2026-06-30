import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_CATEGORIES, SITE_NAME, SITE_SLOGAN } from '@/lib/site';
import { getCategoriesSafe } from '@/lib/posts';
import { slugify } from '@/lib/slug';

export async function Header() {
  const dbCategories = await getCategoriesSafe();
  const categories =
    dbCategories.length > 0
      ? dbCategories.map((category) => ({ name: category.name, slug: category.slug }))
      : INITIAL_CATEGORIES.map((name) => ({ name, slug: slugify(name, 'categoria') }));
  const today = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/La_Rioja'
  }).format(new Date());

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container topbar-inner">
          <span>Actualidad riojana en tiempo real</span>
          <span className="topbar-date">{today}</span>
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </div>
      </div>

      <div className="container masthead">
        <div className="brand-row">
          <Link href="/" className="brand" aria-label="Inicio de La Voz Riojana">
            <Image src="/brand-logo.svg" alt="La Voz Riojana" width={52} height={52} className="brand-mark" priority />
            <span>
              <strong className="brand-name">{SITE_NAME}</strong>
              <span className="brand-slogan">{SITE_SLOGAN}</span>
            </span>
          </Link>
          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav className="nav-list" aria-label="Categorias moviles">
              {categories.map((category) => (
                <Link href={`/categoria/${category.slug}`} key={category.slug}>
                  {category.name}
                </Link>
              ))}
            </nav>
          </details>
        </div>

        <form className="search-form" action="/buscar" role="search">
          <input type="search" name="q" placeholder="Buscar noticias" aria-label="Buscar noticias" />
          <button type="submit">Buscar</button>
        </form>
      </div>

      <div className="nav-strip" aria-label="Categorias">
        <nav className="container nav-list">
          {categories.map((category) => (
            <Link href={`/categoria/${category.slug}`} key={category.slug}>
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
